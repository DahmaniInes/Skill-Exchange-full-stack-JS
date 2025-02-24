import React from 'react';
import carousel1 from '../assets/img/carousel-1.jpg'; // Example image import
import '../utils/css/style.css';
import '../utils/css/bootstrap.min.css';

//import '../utils/lib/wow/wow.js';

import '../utils/lib/animate/animate.min.css';
import '../utils/lib/owlcarousel/assets/owl.carousel.min.css';

function NotFound() {
    return (
      <>
    

        {/* 404 Start */}
        <div className="container-xxl py-5 wow fadeInUp" data-wow-delay="0.1s">
            <div className="container text-center">
                <div className="row justify-content-center">
                    <div className="col-lg-6">
                        <h1 className="display-1">404</h1>
                        <h1 className="mb-4">Page Not Found</h1>
                        <p className="mb-4">We’re sorry, the page you have looked for does not exist in our website! Maybe go to our home page or try to use a search?</p>
                        <a className="btn btn-primary rounded-pill py-3 px-5" href="/">Go Back To Home</a>
                    </div>
                </div>
            </div>
        </div>
        {/* 404 End */}
      </>
    );
}

export default NotFound;
