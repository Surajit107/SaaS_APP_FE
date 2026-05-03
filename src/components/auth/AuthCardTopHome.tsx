import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AuthCardTopHomeProps = {
  className?: string;
};

export function AuthCardTopHome({ className }: AuthCardTopHomeProps) {
  return (
    <div
      className={cn(
        'border-primary/10 from-primary/[0.05] via-muted/20 to-background/40 relative z-20 flex justify-center border-b bg-gradient-to-b px-4 py-2 sm:px-8',
        className,
      )}
    >
      <Button
        asChild
        className="text-muted-foreground hover:bg-primary/8 hover:text-foreground h-9 gap-2 rounded-full px-4 text-xs font-medium tracking-wide"
        size="sm"
        variant="ghost"
      >
        <Link title="Return to the main welcome screen" to="/">
          <Home aria-hidden className="text-primary/80 size-3.5 shrink-0" />
          Welcome page
        </Link>
      </Button>
    </div>
  );
}
