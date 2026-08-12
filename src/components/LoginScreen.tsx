import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useAuthStore } from '../lib/supabase';

export const LoginScreen = () => {
  const client = useAuthStore((s) => s.client);

  return (
    <main className="login">
      <h1 className="login__title">Career Compass</h1>
      <p className="login__lead">
        エンジニア転職で年収 1000 万円に到達するための現在地管理と書類生成
      </p>
      <div className="login__box">
        <Auth
          supabaseClient={client}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: { colors: { brand: '#2563eb', brandAccent: '#1d4ed8' } },
            },
          }}
          providers={['google', 'github']}
        />
      </div>
    </main>
  );
};
