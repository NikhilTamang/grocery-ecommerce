import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <>
      <p>Banner</p>
      <p>Navbar</p>
      <main className="min-h-screen">
        <Outlet />
      </main>
      <p>Footer</p>
      <p>Cartsidebar</p>
    </>
  );
};

export default AppLayout;
