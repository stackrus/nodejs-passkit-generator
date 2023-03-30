export const MainLayout = ({ children }) => {
  return (
    <div class="flex h-60 min-h-screen flex-col">
      <header class="bg-blue-200 p-4">Card generator</header>
      <main class="h-96 flex-1 bg-blue-50 p-4">{children}</main>
      <footer class="bg-blue-200 p-4">Footer</footer>
    </div>
  );
};
