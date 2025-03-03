package routeutils

import (
	"net/http"
	"os"
	"strings"
)

// CORSConfig holds the CORS configuration
type CORSConfig struct {
	AllowedOrigins []string
	AllowedMethods []string
	AllowedHeaders []string
}

var corsConfig *CORSConfig

// InitCORS initializes the CORS configuration
func InitCORS() {
	// Get the frontend URL from environment variable, default to localhost:3000
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	// Split multiple URLs if provided (comma-separated)
	origins := strings.Split(frontendURL, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}

	corsConfig = &CORSConfig{
		AllowedOrigins: origins,
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{
			"Accept",
			"Content-Type",
			"Content-Length",
			"Accept-Encoding",
			"Authorization",
			"X-CSRF-Token",
		},
	}
}

// isOriginAllowed checks if the origin is in the list of allowed origins
func isOriginAllowed(origin string) bool {
	if corsConfig == nil {
		InitCORS()
	}
	
	// If no origin header is present, reject the request
	if origin == "" {
		return false
	}

	// Check if the origin matches any of the allowed origins
	for _, allowed := range corsConfig.AllowedOrigins {
		if origin == allowed {
			return true
		}
	}
	return false
}

// SetupCORSHeaders adds CORS headers to the response
func SetupCORSHeaders(w http.ResponseWriter, r *http.Request) bool {
	if corsConfig == nil {
		InitCORS()
	}

	origin := r.Header.Get("Origin")
	
	// If origin is not allowed, return false
	if !isOriginAllowed(origin) {
		return false
	}

	// Set CORS headers only for allowed origins
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Methods", joinStrings(corsConfig.AllowedMethods))
	w.Header().Set("Access-Control-Allow-Headers", joinStrings(corsConfig.AllowedHeaders))
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	
	return true
}

// CORSMiddleware wraps an http.HandlerFunc and handles CORS
func CORSMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Handle preflight
		if r.Method == "OPTIONS" {
			HandlePreflight(w, r)
			return
		}

		// Check CORS for other requests
		if !SetupCORSHeaders(w, r) {
			http.Error(w, "Origin not allowed", http.StatusForbidden)
			return
		}

		// Call the wrapped handler
		next(w, r)
	}
}

// HandlePreflight handles OPTIONS requests for CORS preflight
func HandlePreflight(w http.ResponseWriter, r *http.Request) {
	// if !SetupCORSHeaders(w, r) {
    //     http.Error(w, "Origin not allowed", http.StatusForbidden)
    //     return
    // }
	SetupAccessHeaders(w)
	w.WriteHeader(http.StatusOK)
}

// Helper function to join string slices
func joinStrings(strings []string) string {
	result := ""
	for i, s := range strings {
		if i > 0 {
			result += ", "
		}
		result += s
	}
	return result
} 