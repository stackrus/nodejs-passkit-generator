export const MainLayout = ({ children }) => {
  return (
    <div class="flex min-h-screen flex-col overflow-auto">
      <header class="bg-blue-200 p-4">Card generator</header>
      <main class="h-96 flex-1 bg-blue-50 p-4">{children}</main>
      <footer class="bg-blue-200 p-4">Footer</footer>
    </div>
  );
};
