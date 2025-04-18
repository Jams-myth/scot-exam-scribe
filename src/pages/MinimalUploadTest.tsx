
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_URL } from "@/services/api";

const MinimalUploadTest = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Get token once on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    setToken(storedToken);
    
    console.log('MinimalUploadTest: Initial token check');
    console.log('Token exists:', !!storedToken);
    if (storedToken) {
      console.log('Token format:', storedToken.substring(0, 20) + '...');
      
      try {
        // Decode JWT token if it's valid
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
    
    // Ensure token has correct Bearer format
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Log detailed request information
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
      // Make a direct fetch request with minimal configuration
      const response = await fetch(`${API_URL}/papers/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader
        },
        body: formData,
      });
      
      // Log response details
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        setStatus(`Success! Status: ${response.status} ${response.statusText}`);
      } else {
        // Get detailed error information
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        setStatus(`Failed with status: ${response.status} ${response.statusText}`);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed error:', errorJson);
        } catch (e) {
          // Not JSON, just log the text
          console.error('Raw error text:', errorText);
        }
      }
    } catch (error: any) {
      // Detailed error logging
      console.error('Fetch error:', error);
      
      // Detect network errors vs CORS issues
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
  
  // Function to manually test CORS with OPTIONS request
  const testCORS = async () => {
    setStatus('Testing CORS (OPTIONS request)...');
    
    try {
      // Make an OPTIONS request to check CORS configuration
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
          <h2 className="text-lg font-semibold">File Upload Test</h2>
          <Input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileChange} 
            className="mb-2" 
          />
          
          <div className="flex gap-2">
            <Button 
              onClick={testDirectFetch} 
              disabled={!file || uploading || !token}
            >
              Test Upload
            </Button>
            <Button 
              onClick={testCORS} 
              variant="outline"
            >
              Test CORS
            </Button>
          </div>
        </div>
        
        {status && (
          <Alert variant={status.includes('Success') ? "default" : "destructive"}>
            <AlertDescription>
              {status}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs font-mono">
          <p className="font-bold mb-2">Instructions:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Open browser console to see detailed request/response logs</li>
            <li>First check if you have a valid token</li>
            <li>Select a PDF file and click "Test Upload"</li>
            <li>Use "Test CORS" to verify the API allows cross-origin requests</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default MinimalUploadTest;
