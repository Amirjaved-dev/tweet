import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

export default function TokenDebugger() {
  const { getToken, userId } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const handleGetToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = await getToken();
      setToken(authToken);
    } catch (err) {
      setError(`Failed to get token: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setTestLoading(true);
    setTestResult(null);
    setError(null);
    
    try {
      if (!token) {
        const newToken = await getToken();
        setToken(newToken);
      }
      
      const response = await fetch('/api/auth-debug', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      setError(`Auth test failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Debugger</CardTitle>
        <CardDescription>Debug your authentication token issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">User ID:</span>
            {userId ? (
              <Badge variant="outline">{userId}</Badge>
            ) : (
              <Badge variant="destructive">Not logged in</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium">Token Status:</span>
            {loading ? (
              <Badge variant="outline" className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading...
              </Badge>
            ) : token ? (
              <Badge variant="success">Token Available</Badge>
            ) : (
              <Badge variant="secondary">Not Fetched</Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleGetToken} 
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting Token...
              </>
            ) : (
              'Get Token'
            )}
          </Button>
          
          <Button 
            onClick={testAuth} 
            disabled={testLoading || !userId}
            variant="default"
          >
            {testLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Auth'
            )}
          </Button>
        </div>
        
        {token && (
          <div className="mt-4">
            <p className="font-medium mb-1">Token:</p>
            <div className="bg-slate-950 rounded p-2 overflow-x-auto">
              <code className="text-xs text-green-400 break-all">{token}</code>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-950 border border-red-700 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {testResult && (
          <div className="mt-4">
            <p className="font-medium mb-1">Auth Test Result:</p>
            <div className="bg-slate-950 rounded p-3 overflow-x-auto">
              <pre className="text-xs text-blue-400">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 