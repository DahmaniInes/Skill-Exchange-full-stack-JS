import React from 'react';

function Unauthorized() {
  return (
    <div>
      {/* Unauthorized Section */}
      <div className="container-xxl py-5">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8 wow fadeInUp" data-wow-delay="0.1s">
              <h6 className="section-title bg-white text-center text-danger px-3 mb-3">
                Access Denied
              </h6>
              <h1 className="mb-4">Unauthorized Access</h1>
              <p className="mb-4">
                Oops! You don’t have permission to view this page.
              </p>
              <p className="mb-4">
                This section is restricted. If you believe this is an error,
                please contact the administrator or log in with an authorized account.
              </p>

            </div>
          </div>
        </div>
      </div>

     
    </div>
  );
}

export default Unauthorized;
