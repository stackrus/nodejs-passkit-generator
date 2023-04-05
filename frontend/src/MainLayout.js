export const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col overflow-auto">
      <header className="bg-blue-200 p-4">Card generator</header>
      <main className="h-96 flex-1 bg-blue-50 p-4">{children}</main>
      <footer className="bg-blue-200 p-4">Footer</footer>
    </div>
  );
};
