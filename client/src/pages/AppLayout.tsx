import { Outlet } from "react-router-dom";
import Banner from "../components/Banner";

const AppLayout = () => {
  return (
    <>
      <Banner />
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
