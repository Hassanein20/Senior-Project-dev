package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// IPRateLimiter manages rate limiting by IP address
type IPRateLimiter struct {
	ips    map[string]*rate.Limiter
	mu     sync.RWMutex
	rate   rate.Limit
	burst  int
	ttl    time.Duration
	lastIP map[string]time.Time
}

// NewIPRateLimiter creates a new rate limiter for IP addresses
func NewIPRateLimiter(r rate.Limit, b int, ttl time.Duration) *IPRateLimiter {
	i := &IPRateLimiter{
		ips:    make(map[string]*rate.Limiter),
		rate:   r,
		burst:  b,
		ttl:    ttl,
		lastIP: make(map[string]time.Time),
	}

	// Start a cleanup routine for old limiters
	go i.cleanupRoutine()

	return i
}

// cleanupRoutine periodically cleans up old limiters
func (i *IPRateLimiter) cleanupRoutine() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		i.cleanup()
	}
}

// cleanup removes old limiters that haven't been used for TTL
func (i *IPRateLimiter) cleanup() {
	i.mu.Lock()
	defer i.mu.Unlock()

	now := time.Now()
	for ip, lastSeen := range i.lastIP {
		if now.Sub(lastSeen) > i.ttl {
			delete(i.ips, ip)
			delete(i.lastIP, ip)
		}
	}
}

// GetLimiter returns the rate limiter for an IP address
func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	limiter, exists := i.ips[ip]
	if !exists {
		limiter = rate.NewLimiter(i.rate, i.burst)
		i.ips[ip] = limiter
	}

	i.lastIP[ip] = time.Now()
	return limiter
}

// RateLimiter returns a middleware that limits request rate by IP
func RateLimiter(r rate.Limit, b int) gin.HandlerFunc {
	// Create a limiter with 1 hour TTL
	limiter := NewIPRateLimiter(r, b, time.Hour)

	return func(c *gin.Context) {
		ip := getClientIP(c)
		if !limiter.GetLimiter(ip).Allow() {
			c.Header("Retry-After", "60") // 1 minute retry
			c.AbortWithStatusJSON(http.StatusTooManyRequests,
				gin.H{"error": "Rate limit exceeded. Please try again later."})
			return
		}
		c.Next()
	}
}

// getClientIP extracts the client IP address from the request
func getClientIP(c *gin.Context) string {
	// Check for X-Forwarded-For and X-Real-IP headers
	if xForwardedFor := c.GetHeader("X-Forwarded-For"); xForwardedFor != "" {
		return xForwardedFor
	}

	if xRealIP := c.GetHeader("X-Real-IP"); xRealIP != "" {
		return xRealIP
	}

	return c.ClientIP()
}
