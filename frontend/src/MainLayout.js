export const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col overflow-auto">
      <header className="bg-white p-4 shadow-2xl">
        <a
          href="https://p11.co/"
          className="flex justify-between items-center w-48"
        >
          <img
            src="https://avatars.githubusercontent.com/u/82522071?s=200&v=4"
            alt="logo"
            className="h-16"
          />
          <img
            src="https://p11.co/assets/logo-caption.svg"
            alt="logo"
            className="h-4"
          />
        </a>
      </header>
      <main className="h-96 flex-1 bg-gray-200 p-4">{children}</main>
      <footer className="bg-white p-4 shadow-2xl h-20"></footer>
    </div>
  );
};
