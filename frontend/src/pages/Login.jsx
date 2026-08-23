import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="login-card">
      <CardHeader>
        <CardTitle>Owner Login</CardTitle>
        <CardDescription>Restricted area — MenOfMatrix staff only.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            type="password"
            placeholder="Dashboard password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <Button disabled={busy || !password}>{busy ? 'Signing in…' : 'Sign in'}</Button>
          {error && <p className="text-sm text-[#aa2d00]">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

