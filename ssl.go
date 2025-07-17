package main

import (
	"crypto/tls"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"
)

func main() {
	//target1, _ := url.Parse("http://emmett:2401")
	target1, _ := url.Parse("https://coverity-classic.integrations.duckutil.net:8443")
	target2, _ := url.Parse("https://artifactory.tools.duckutil.net")
	target3, _ := url.Parse("https://repo.blackduck.com/")

	// Create proxies for both targets with custom transport
	transport := &http.Transport{
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true, // Skip verification for upstream servers
		},
		MaxIdleConns:        100,
		IdleConnTimeout:     90 * time.Second,
		DisableCompression:  false,
		ForceAttemptHTTP2:   false, // Disable HTTP/2 for upstream connections
		DisableKeepAlives:   false,
		MaxIdleConnsPerHost: 10,
	}

	proxy1 := httputil.NewSingleHostReverseProxy(target1)
	proxy1.Transport = transport

	proxy2 := httputil.NewSingleHostReverseProxy(target2)
	proxy2.Transport = transport

	proxy3 := httputil.NewSingleHostReverseProxy(target3)
	proxy3.Transport = transport

	// Custom error handler for proxy failures
	errorHandler := func(w http.ResponseWriter, req *http.Request, err error) {
		log.Printf("Proxy error for %s %s: %v", req.Method, req.URL.Path, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		w.Write([]byte(`{"error": "upstream server unavailable", "message": "This is expected in testing environment"}`))
	}

	// Set error handlers for proxies
	proxy1.ErrorHandler = errorHandler
	proxy2.ErrorHandler = errorHandler
	proxy3.ErrorHandler = errorHandler

	// Route requests based on the Host header or path
	http.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		log.Printf("Received request: %s %s from %s", req.Method, req.URL.Path, req.RemoteAddr)

		// Add CORS headers for testing
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if req.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// For testing: respond to health check endpoints directly
		if req.URL.Path == "/health" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status": "ok", "message": "SSL proxy is running"}`))
			return
		}

		// Route to artifactory if path contains /artifactory/
		if strings.Contains(req.URL.Path, "/artifactory/") {
			log.Printf("Proxying to internal artifactory: %s", req.URL.Path)

			// Create a copy of the request to avoid modifying the original
			proxyReq := req.Clone(req.Context())
			proxyReq.URL.Host = target2.Host
			proxyReq.URL.Scheme = target2.Scheme
			proxyReq.Header.Set("Host", target2.Host)
			proxyReq.RequestURI = "" // Must clear this for proxy

			proxy2.ServeHTTP(w, proxyReq)
		} else if strings.Contains(req.URL.Path, "blackduck/integration") {
			log.Printf("Proxying to public artifactory: %s", req.URL.Path)

			// Create a copy of the request to avoid modifying the original
			proxyReq := req.Clone(req.Context())
			proxyReq.URL.Host = target3.Host
			proxyReq.URL.Scheme = target3.Scheme
			proxyReq.Header.Set("Host", target3.Host)
			proxyReq.RequestURI = "" // Must clear this for proxy

			proxy3.ServeHTTP(w, proxyReq)
		} else {
			log.Printf("Proxying to product: %s", req.URL.Path)

			// Create a copy of the request to avoid modifying the original
			proxyReq := req.Clone(req.Context())
			proxyReq.URL.Host = target1.Host
			proxyReq.URL.Scheme = target1.Scheme
			proxyReq.Header.Set("Host", target1.Host)
			proxyReq.RequestURI = "" // Must clear this for proxy

			proxy1.ServeHTTP(w, proxyReq)
		}
	})

	// Configure TLS with LibreSSL compatible options
	tlsConfig := &tls.Config{
		MinVersion: tls.VersionTLS12,
		MaxVersion: tls.VersionTLS13,
		// Let Go choose the best cipher suites for LibreSSL compatibility
		NextProtos: []string{"http/1.1"}, // Force HTTP/1.1 only
	}

	// Configure HTTPS server
	httpsServer := &http.Server{
		Addr:         "coverity-classic.integrations.duckutil.net",
		ReadTimeout:  30 * time.Second,  // Increased for larger downloads
		WriteTimeout: 60 * time.Second,  // Increased for larger downloads
		IdleTimeout:  120 * time.Second, // Increased for keep-alive
		TLSConfig:    tlsConfig,
		Handler:      nil,                                                          // Use default ServeMux
		TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler)), // Disable HTTP/2
	}

	log.Println("Starting HTTPS server on localhost:8443...")

	// Load and validate certificate
	cert, err := tls.LoadX509KeyPair("/Users/renukac/Documents/workspace/ssl-cert/covserver.crt", "/Users/renukac/Documents/workspace/ssl-cert/covserver.key")
	if err != nil {
		log.Fatalf("Failed to load certificate: %v", err)
	}

	// Add certificate to TLS config
	tlsConfig.Certificates = []tls.Certificate{cert}

	// Use ListenAndServe with custom TLS listener for better control
	listener, err := tls.Listen("tcp", "localhost:8443", tlsConfig)
	if err != nil {
		log.Fatalf("Failed to create TLS listener: %v", err)
	}
	defer func() {
		if closeErr := listener.Close(); closeErr != nil {
			log.Printf("Error closing listener: %v", closeErr)
		}
	}()

	log.Println("HTTPS server started successfully on localhost:8443")
	if err := httpsServer.Serve(listener); err != nil {
		log.Fatalf("HTTPS Server failed: %v", err)
	}
}
