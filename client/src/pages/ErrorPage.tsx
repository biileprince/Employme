import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const ErrorPage = () => {
  const error = useRouteError();
  
  let errorMessage = 'An unexpected error has occurred.';
  let statusText = 'Error';
  let status = '500';
  
  if (isRouteErrorResponse(error)) {
    errorMessage = error.data?.message || error.statusText;
    statusText = error.statusText;
    status = error.status.toString();
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">{status}</h1>
      <p className="text-2xl font-medium mb-2">{statusText}</p>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">{errorMessage}</p>
      
      <Link to="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
};

export default ErrorPage;
