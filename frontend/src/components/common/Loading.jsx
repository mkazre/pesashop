export default function Loading({ fullScreen = false, text = 'Loading...' }) {
  const Container = fullScreen ? 'div' : 'div';
  const containerClass = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50'
    : 'flex items-center justify-center py-12';

  return (
    <Container className={containerClass}>
      <div className="text-center">
        <div className="inline-block">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
        {text && <p className="mt-4 text-gray-600">{text}</p>}
      </div>
    </Container>
  );
}
