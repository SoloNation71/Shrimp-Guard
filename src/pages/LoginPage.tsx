import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Waves, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('owner@shrimpguard.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-surface)' }}>
      <div className="w-full max-w-sm space-y-6 animate-slide-up">
        {/* Logo */}
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl gradient-ocean flex items-center justify-center mx-auto mb-4">
            <Waves className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ShrimpGuard</h1>
          <p className="text-sm text-muted-foreground mt-1">Aquaculture Monitoring Dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <Button type="submit" className="w-full gradient-ocean" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign In'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Demo: <code className="bg-muted px-1 rounded">owner@shrimpguard.com</code> / <code className="bg-muted px-1 rounded">demo1234</code>
          </p>
        </form>
      </div>
    </div>
  );
}
