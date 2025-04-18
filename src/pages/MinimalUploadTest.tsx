import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_URL } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, RadioTower, Shield, ArrowRightLeft } from "lucide-react";

const MinimalUploadTest = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [networkTrace, setNetworkTrace] = useState<any | null>(null);
  const [showNetworkTrace, setShowNetworkTrace] = useState(false);
  const [tlsStatus, setTlsStatus] = useState<string | null>(null);
  const [proxyStatus, setProxyStatus] = useState<string | null>(null);
  const [isTlsChecking, setIsTlsChecking] = useState(false);
  
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    setToken(storedToken);
    
    console.log('MinimalUploadTest: Initial token check');
    console.log('Token exists:', !!storedToken);
    if (storedToken) {
      console.log('Token format:', storedToken.substring(0, 20) + '...');
      
      try {
        const parts = storedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('Token payload:', payload);
        }
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    if (selectedFile) {
      console.log('File selected:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: `${(selectedFile.size / 1024).toFixed(2)} KB`
      });
    }
  };

  const testDirectFetch = async () => {
    if (!file) {
      setStatus('No file selected');
      return;
    }
    
    if (!token) {
      setStatus('No authentication token found');
      return;
    }
    
    setUploading(true);
    setStatus('Starting upload test...');
    
    const formData = new FormData();
    formData.append("file", file);
    
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    console.log('========== DIRECT FETCH TEST ==========');
    console.log('API URL:', API_URL);
    console.log('Endpoint:', '/papers/pdf');
    console.log('File:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`
    });
    console.log('Headers:', {
      Authorization: authHeader.substring(0, 20) + '...'
    });
    
    try {
      const response = await fetch(`${API_URL}/papers/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader
        },
        body: formData,
      });
      
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        setStatus(`Success! Status: ${response.status} ${response.statusText}`);
      } else {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        setStatus(`Failed with status: ${response.status} ${response.statusText}`);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed error:', errorJson);
        } catch (e) {
          console.error('Raw error text:', errorText);
        }
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        const errorMessage = `Network error: Could not connect to API server at ${API_URL}. This could be due to:
        1. The API server is down or unreachable
        2. CORS is not configured correctly on the server
        3. There's a network connectivity issue`;
        
        console.error(errorMessage);
        setStatus('Network error: Failed to connect to API server');
      } else {
        setStatus(`Error: ${error.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const testCORS = async () => {
    setStatus('Testing CORS (OPTIONS request)...');
    
    try {
      const response = await fetch(`${API_URL}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST'
        }
      });
      
      console.log('CORS test status:', response.status, response.statusText);
      console.log('CORS headers:', Object.fromEntries([...response.headers.entries()]));
      
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods',
        'access-control-allow-headers',
        'access-control-allow-credentials'
      ];
      
      const foundHeaders = corsHeaders.filter(header => 
        response.headers.has(header)
      );
      
      if (foundHeaders.length > 0) {
        setStatus(`CORS appears configured. Found CORS headers: ${foundHeaders.join(', ')}`);
      } else {
        setStatus(`CORS test complete: No CORS headers found, possible misconfiguration`);
      }
    } catch (error: any) {
      console.error('CORS test error:', error);
      setStatus(`CORS test failed: ${error.message}`);
    }
  };

  const checkAPIStatus = async () => {
    setStatus('Checking API status...');
    
    try {
      const response = await fetch(`${API_URL}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('API Status Check:', {
        url: `${API_URL}/status`,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Status Response:', data);
        setStatus(`API is reachable! Response: ${JSON.stringify(data)}`);
      } else {
        const errorText = await response.text();
        console.error('API Status Error:', errorText);
        setStatus(`API check failed: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('API Status Check Error:', error);
      setStatus(`API check error: ${error.message}`);
    }
  };

  const checkTLS = async () => {
    setIsTlsChecking(true);
    setTlsStatus('Checking TLS connection...');
    
    try {
      // Create a unique URL to prevent caching
      const timestamp = new Date().getTime();
      const imageUrl = `${API_URL}/favicon.ico?nocache=${timestamp}`;
      
      console.log(`Checking TLS with image load from: ${imageUrl}`);
      
      // First try a HEAD request to check connection without downloading content
      const headResponse = await fetch(imageUrl, { 
        method: 'HEAD',
        mode: 'cors',
      });
      
      console.log('HEAD request response:', {
        status: headResponse.status,
        ok: headResponse.ok,
        headers: Object.fromEntries([...headResponse.headers.entries()])
      });
      
      if (headResponse.ok) {
        setTlsStatus(`TLS connection successful! Status: ${headResponse.status}`);
      } else {
        setTlsStatus(`TLS check failed with status: ${headResponse.status}`);
      }
      
      // Capture full network trace
      const traceData = {
        url: imageUrl,
        method: 'HEAD',
        timestamp: new Date().toISOString(),
        status: headResponse.status,
        statusText: headResponse.statusText,
        headers: Object.fromEntries([...headResponse.headers.entries()]),
        ok: headResponse.ok
      };
      
      setNetworkTrace(prev => ({
        ...prev,
        tlsCheck: traceData
      }));
      
    } catch (error: any) {
      console.error('TLS check error:', error);
      
      const errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      
      setNetworkTrace(prev => ({
        ...prev,
        tlsCheckError: errorDetails
      }));
      
      setTlsStatus(`TLS check failed: ${error.message}. This could indicate certificate issues or network problems.`);
    } finally {
      setIsTlsChecking(false);
    }
  };
  
  const testApiProxy = async () => {
    setProxyStatus('Testing API through Vite proxy...');
    
    try {
      // Use the proxied path instead of direct API URL
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('Proxy test response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()])
      });
      
      // Capture the network trace
      const traceData = {
        url: '/api/health',
        method: 'GET',
        timestamp: new Date().toISOString(),
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        ok: response.ok
      };
      
      setNetworkTrace(prev => ({
        ...prev,
        proxyTest: traceData
      }));
      
      if (response.ok) {
        const data = await response.text();
        setProxyStatus(`Proxy successful! Response: ${data}`);
      } else {
        setProxyStatus(`Proxy test failed with status: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Proxy test error:', error);
      
      const errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      
      setNetworkTrace(prev => ({
        ...prev,
        proxyTestError: errorDetails
      }));
      
      setProxyStatus(`Proxy test error: ${error.message}`);
    }
  };

  const captureNetworkTrace = async () => {
    setStatus('Capturing network trace...');
    
    const trace: any = {
      captureTime: new Date().toISOString(),
      browser: navigator.userAgent,
      api: {
        url: API_URL,
        isTokenPresent: !!token,
      },
      tests: {}
    };
    
    // Simple status endpoint test
    try {
      const statusStart = performance.now();
      const statusResponse = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const statusEnd = performance.now();
      
      trace.tests.status = {
        url: `${API_URL}/health`,
        method: 'GET',
        duration: statusEnd - statusStart,
        status: statusResponse.status,
        statusText: statusResponse.statusText,
        headers: Object.fromEntries([...statusResponse.headers.entries()]),
        ok: statusResponse.ok
      };
      
      if (statusResponse.ok) {
        try {
          const text = await statusResponse.text();
          trace.tests.status.body = text;
        } catch (e) {
          trace.tests.status.bodyError = String(e);
        }
      }
    } catch (error: any) {
      trace.tests.status = {
        error: error.message,
        stack: error.stack,
        name: error.name
      };
    }
    
    // OPTIONS preflight test
    try {
      const optionsStart = performance.now();
      const optionsResponse = await fetch(`${API_URL}/papers/pdf`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Authorization,Content-Type'
        }
      });
      const optionsEnd = performance.now();
      
      trace.tests.options = {
        url: `${API_URL}/papers/pdf`,
        method: 'OPTIONS',
        duration: optionsEnd - optionsStart,
        status: optionsResponse.status,
        statusText: optionsResponse.statusText,
        headers: Object.fromEntries([...optionsResponse.headers.entries()]),
        ok: optionsResponse.ok
      };
    } catch (error: any) {
      trace.tests.options = {
        error: error.message,
        stack: error.stack,
        name: error.name
      };
    }
    
    // Network information if available
    if ('connection' in navigator && navigator.connection) {
      const conn = navigator.connection as any;
      trace.network = {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }
    
    setNetworkTrace(trace);
    setShowNetworkTrace(true);
    setStatus('Network trace captured');
  };
  
  const exportNetworkTrace = () => {
    if (!networkTrace) return;
    
    const jsonContent = JSON.stringify(networkTrace, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-trace-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6 max-w-xl mx-auto mt-8 space-y-4">
      <h1 className="text-2xl font-bold">Minimal Upload Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          <Alert variant={token ? "default" : "destructive"}>
            <AlertDescription>
              {token 
                ? `Token found: ${token.substring(0, 20)}...` 
                : "No authentication token found. Please login first."}
            </AlertDescription>
          </Alert>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">API Configuration</h2>
          <Alert variant="default">
            <AlertDescription>
              API URL: {API_URL}
            </AlertDescription>
          </Alert>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">API Connectivity Tests</h2>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={checkAPIStatus}
              variant="secondary"
            >
              Check API Reachability
            </Button>
            <Button 
              onClick={testCORS} 
              variant="outline"
            >
              Test CORS
            </Button>
            <Button 
              onClick={checkTLS}
              variant="outline"
              disabled={isTlsChecking}
            >
              <Shield className="h-4 w-4 mr-2" />
              Check TLS
            </Button>
            <Button 
              onClick={testApiProxy}
              variant="outline"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Test API Proxy
            </Button>
            <Button 
              onClick={captureNetworkTrace}
              variant="outline"
            >
              <RadioTower className="h-4 w-4 mr-2" />
              Capture Network Trace
            </Button>
          </div>
          
          {tlsStatus && (
            <Alert variant={tlsStatus.includes('successful') ? "default" : "destructive"}>
              <AlertDescription>{tlsStatus}</AlertDescription>
            </Alert>
          )}
          
          {proxyStatus && (
            <Alert variant={proxyStatus.includes('successful') ? "default" : "destructive"}>
              <AlertDescription>{proxyStatus}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">File Upload Test</h2>
          <Input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileChange} 
            className="mb-2" 
          />
          
          <Button 
            onClick={testDirectFetch} 
            disabled={!file || uploading || !token}
          >
            Test Upload
          </Button>
        </div>
        
        {status && (
          <Alert variant={status.includes('Success') || status.includes('reachable') ? "default" : "destructive"}>
            <AlertDescription>
              {status}
            </AlertDescription>
          </Alert>
        )}
        
        {networkTrace && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Network Trace</h2>
              <div className="space-x-2">
                <Button onClick={() => setShowNetworkTrace(!showNetworkTrace)} variant="outline" size="sm">
                  {showNetworkTrace ? "Hide" : "Show"} Details
                </Button>
                <Button onClick={exportNetworkTrace} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Trace
                </Button>
              </div>
            </div>
            
            {showNetworkTrace && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs font-mono overflow-auto max-h-96">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(networkTrace, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs font-mono">
          <p className="font-bold mb-2">Instructions:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Open browser console to see detailed request/response logs</li>
            <li>First check if you have a valid token</li>
            <li>Use "Check API Reachability" to test basic connectivity</li>
            <li>Use "Test CORS" to verify cross-origin request settings</li>
            <li>Use "Check TLS" to verify SSL certificate issues</li>
            <li>Use "Test API Proxy" to test Vite's proxy (bypasses CORS)</li>
            <li>Use "Capture Network Trace" for detailed diagnostics</li>
            <li>Select a PDF file and click "Test Upload" to test the upload endpoint</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default MinimalUploadTest;
