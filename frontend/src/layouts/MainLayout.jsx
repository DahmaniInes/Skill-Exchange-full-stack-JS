import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './style.css'
function MainLayout() {
    return (
        <div className="app-layout">
            <Header />
            <main className="content-wrapper">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default MainLayout;