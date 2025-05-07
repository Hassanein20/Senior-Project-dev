package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeaders adds security headers to responses
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// HTTP Strict Transport Security (HSTS)
		// Ensures the browser always uses HTTPS for future requests
		c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")

		// X-Content-Type-Options
		// Prevents browsers from MIME-sniffing a response from the declared content-type
		c.Header("X-Content-Type-Options", "nosniff")

		// X-Frame-Options
		// Prevents clickjacking by not allowing the page to be embedded in frames
		c.Header("X-Frame-Options", "DENY")

		// X-XSS-Protection
		// Enables browser's built-in XSS protection
		c.Header("X-XSS-Protection", "1; mode=block")

		// Referrer-Policy
		// Controls how much referrer information is included with requests
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Content-Security-Policy
		// Mitigates against XSS attacks by defining which content sources are trusted
		c.Header("Content-Security-Policy", buildCSP())

		// Permissions-Policy (formerly Feature-Policy)
		// Controls which browser features can be used
		c.Header("Permissions-Policy", buildPermissionsPolicy())

		// Remove Server header
		// Removes information about the server software
		c.Header("Server", "")

		c.Next()
	}
}

// buildCSP builds a comprehensive Content Security Policy
func buildCSP() string {
	// This is a relatively strict CSP - you may need to adjust it based on your application's needs
	directives := []string{
		"default-src 'self'",               // Default fallback for all directives
		"script-src 'self'",                // Only allow scripts from your domain
		"style-src 'self' 'unsafe-inline'", // Allow inline styles and styles from your domain
		"img-src 'self' data:",             // Allow images from your domain and data URIs
		"font-src 'self'",                  // Only allow fonts from your domain
		"connect-src 'self'",               // Restrict XHR, WebSockets to your domain
		"media-src 'self'",                 // Restrict audio/video sources
		"object-src 'none'",                // Disallow plugins (Flash, Java, etc.)
		"frame-src 'none'",                 // Disallow framing
		"base-uri 'self'",                  // Restrict base URI for relative URLs
		"form-action 'self'",               // Restrict where forms can submit to
		"frame-ancestors 'none'",           // Disallow framing (similar to X-Frame-Options)
		"block-all-mixed-content",          // Block HTTP content on HTTPS pages
		"upgrade-insecure-requests",        // Upgrade HTTP requests to HTTPS if possible
	}

	return join(directives, "; ")
}

// buildPermissionsPolicy builds a Permissions-Policy header
func buildPermissionsPolicy() string {
	// Define which browser features are allowed
	directives := []string{
		"camera=()",          // Disable camera access
		"microphone=()",      // Disable microphone access
		"geolocation=()",     // Disable geolocation
		"payment=()",         // Disable payment API
		"usb=()",             // Disable USB access
		"fullscreen=(self)",  // Allow fullscreen only for your site
		"display-capture=()", // Disable screen capture
		"accelerometer=()",   // Disable accelerometer
		"gyroscope=()",       // Disable gyroscope
		"magnetometer=()",    // Disable magnetometer
		"interest-cohort=()", // Disable FLoC (Federated Learning of Cohorts)
	}

	return join(directives, ", ")
}

// join joins strings with a separator
func join(strings []string, separator string) string {
	result := ""
	for i, s := range strings {
		if i > 0 {
			result += separator
		}
		result += s
	}
	return result
}
