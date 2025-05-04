package middleware

import "github.com/gin-gonic/gin"

func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Essential security headers
		c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy",
			"default-src 'self'; script-src 'self' 'unsafe-inline' *.trusted.com;")

		// Remove server header
		c.Header("Server", "")

		c.Next()
	}
}
