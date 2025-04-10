import React, { useState, useEffect } from 'react';
import CourseCard from '../components/CourseCard';
import about from '../assets/img/about.jpg';
import cat1 from '../assets/img/cat-1.jpg';
import cat2 from '../assets/img/cat-2.jpg';
import cat3 from '../assets/img/cat-3.jpg';
import cat4 from '../assets/img/cat-4.jpg';
import team1 from '../assets/img/team-1.jpg';
import team2 from '../assets/img/team-2.jpg';
import team3 from '../assets/img/team-3.jpg';
import team4 from '../assets/img/team-4.jpg';
import testimonial1 from '../assets/img/testimonial-1.jpg';
import testimonial2 from '../assets/img/testimonial-2.jpg';
import testimonial3 from '../assets/img/testimonial-3.jpg';
import testimonial4 from '../assets/img/testimonial-4.jpg';


/*import '../utils/css/bootstrap.min.css';
import '../utils/css/style.css';
import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css';
import 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css';
import '../utils/lib/animate/animate.min.css';
import '../utils/lib/owlcarousel/assets/owl.carousel.min.css';*/


const Home = () => {
    /*useEffect(() => {
        const scripts = [
            "https://code.jquery.com/jquery-3.4.1.min.js",
            "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js",
            "../utils/lib/wow/wow.min.js",
            "../utils/lib/easing/easing.min.js",
            "../utils/lib/waypoints/waypoints.min.js",
            "../utils/lib/owlcarousel/owl.carousel.min.js",
            "../utils/js/main.js"
        ];

        const scriptElements = scripts.map((src) => {
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            document.body.appendChild(script);
            return script;
        });

        return () => {
            scriptElements.forEach((script) => {
                document.body.removeChild(script);
            });
        };
    }, []);*/

        const [courses, setCourses] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);

        useEffect(() => {
            const fetchCourses = async () => {
                try {
                    const response = await fetch('/api/courses');
                    if (!response.ok) throw new Error('Échec du chargement');
                    const data = await response.json();
                    setCourses(data);
                } catch (err) {
                    console.error("Erreur:", err);
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchCourses();
        }, []);

    return (
        <div>

            {/* Service Start */}
            <div className="container-xxl py-5">
                <div className="container">
                    <div className="row g-4">
                        <div className="col-lg-3 col-sm-6 wow fadeInUp" data-wow-delay="0.1s">
                            <div className="service-item text-center pt-3">
                                <div className="p-4">
                                    <i className="fa fa-3x fa-graduation-cap text-primary mb-4"></i>
                                    <h5 className="mb-3">Skilled Instructors</h5>
                                    <p>Diam elitr kasd sed at elitr sed ipsum justo dolor sed clita amet diam</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-sm-6 wow fadeInUp" data-wow-delay="0.3s">
                            <div className="service-item text-center pt-3">
                                <div className="p-4">
                                    <i className="fa fa-3x fa-globe text-primary mb-4"></i>
                                    <h5 className="mb-3">Online Classes</h5>
                                    <p>Diam elitr kasd sed at elitr sed ipsum justo dolor sed clita amet diam</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-sm-6 wow fadeInUp" data-wow-delay="0.5s">
                            <div className="service-item text-center pt-3">
                                <div className="p-4">
                                    <i className="fa fa-3x fa-home text-primary mb-4"></i>
                                    <h5 className="mb-3">Home Projects</h5>
                                    <p>Diam elitr kasd sed at elitr sed ipsum justo dolor sed clita amet diam</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-sm-6 wow fadeInUp" data-wow-delay="0.7s">
                            <div className="service-item text-center pt-3">
                                <div className="p-4">
                                    <i className="fa fa-3x fa-book-open text-primary mb-4"></i>
                                    <h5 className="mb-3">Book Library</h5>
                                    <p>Diam elitr kasd sed at elitr sed ipsum justo dolor sed clita amet diam</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Service End */}

            {/* About Start */}
            <div className="container-xxl py-5">
                <div className="container">
                    <div className="row g-5">
                        <div className="col-lg-6 wow fadeInUp" data-wow-delay="0.1s" style={{ minHeight: '400px' }}>
                            <div className="position-relative h-100">
                                <img className="img-fluid position-absolute w-100 h-100" src={about} alt="" style={{ objectFit: 'cover' }} />
                            </div>
                        </div>
                        <div className="col-lg-6 wow fadeInUp" data-wow-delay="0.3s">
                            <h6 className="section-title bg-white text-start text-primary pe-3">About Us</h6>
                            <h1 className="mb-4">Welcome to E-learning</h1>
                            <p className="mb-4">Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit.</p>
                            <p className="mb-4">Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit. Aliqu diam amet diam et eos. Clita erat ipsum et lorem et sit, sed stet lorem sit clita duo justo magna dolore erat amet</p>
                            <div className="row gy-2 gx-4 mb-4">
                                <div className="col-sm-6">
                                    <p className="mb-0"><i className="fa fa-arrow-right text-primary me-2"></i>Skilled Instructors</p>
                                </div>
                                <div className="col-sm-6">
                                    <p className="mb-0"><i className="fa fa-arrow-right text-primary me-2"></i>Online Classes</p>
                                </div>
                                <div className="col-sm-6">
                                    <p className="mb-0"><i className="fa fa-arrow-right text-primary me-2"></i>International Certificate</p>
                                </div>
                                <div className="col-sm-6">
                                    <p className="mb-0"><i className="fa fa-arrow-right text-primary me-2"></i>Skilled Instructors</p>
                                </div>
                                <div className="col-sm-6">
                                    <p className="mb-0"><i className="fa fa-arrow-right text-primary me-2"></i>Online Classes</p>
                                </div>
                                <div className="col-sm-6">
                                    <p className="mb-0"><i className="fa fa-arrow-right text-primary me-2"></i>International Certificate</p>
                                </div>
                            </div>
                            <a className="btn btn-primary py-3 px-5 mt-2" href="">Read More</a>
                        </div>
                    </div>
                </div>
            </div>
            {/* About End */}

            {/* Categories Start */}
            <div className="container-xxl py-5 category">
                <div className="container">
                    <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
                        <h6 className="section-title bg-white text-center text-primary px-3">Categories</h6>
                        <h1 className="mb-5">Categories des cours</h1>
                    </div>
                    <div className="row g-3">
                        <div className="col-lg-7 col-md-6">
                            <div className="row g-3">
                                <div className="col-lg-12 col-md-12 wow zoomIn" data-wow-delay="0.1s">
                                    <a className="position-relative d-block overflow-hidden" href="">
                                        <img className="img-fluid" src={cat1} alt="" />
                                        <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                                            <h5 className="m-0">Web Design</h5>
                                            <small className="text-primary">49 Cours</small>
                                        </div>
                                    </a>
                                </div>
                                <div className="col-lg-6 col-md-12 wow zoomIn" data-wow-delay="0.3s">
                                    <a className="position-relative d-block overflow-hidden" href="">
                                        <img className="img-fluid" src={cat2} alt="" />
                                        <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                                            <h5 className="m-0">Graphic Design</h5>
                                            <small className="text-primary">49 Cours</small>
                                        </div>
                                    </a>
                                </div>
                                <div className="col-lg-6 col-md-12 wow zoomIn" data-wow-delay="0.5s">
                                    <a className="position-relative d-block overflow-hidden" href="">
                                        <img className="img-fluid" src={cat3} alt="" />
                                        <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                                            <h5 className="m-0">Video Editing</h5>
                                            <small className="text-primary">49 Cours</small>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-5 col-md-6 wow zoomIn" data-wow-delay="0.7s" style={{ minHeight: '350px' }}>
                            <a className="position-relative d-block h-100 overflow-hidden" href="">
                                <img className="img-fluid position-absolute w-100 h-100" src={cat4} alt="" style={{ objectFit: 'cover' }} />
                                <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                                    <h5 className="m-0">Online Marketing</h5>
                                    <small className="text-primary">49 Cours</small>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            {/* Categories Start */}

            {/* Courses Start */}
            <div className="container-xxl py-5">
                <div className="container">
                <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
                    <h6 className="section-title bg-white text-center text-primary px-3">Cours</h6>
                </div>
                
                {loading ? (
                    <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-5 text-danger">
                    Erreur: {error}
                    </div>
                ) : (
                    <div className="row g-4 justify-content-center">
                    {courses.slice(0, 3).map((course, index) => (
                        <div key={course.id} className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay={`${0.1 * (index + 1)}s`}>
                        <CourseCard course={course} />
                        </div>
                    ))}
                    </div>
                )}
                </div>
            </div>
            {/* Courses End */}

            {/* Team Start */}
            <div className="container-xxl py-5">
                <div className="container">
                    <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
                        <h6 className="section-title bg-white text-center text-primary px-3">Instructors</h6>
                        <h1 className="mb-5">Expert Instructors</h1>
                    </div>
                    <div className="row g-4">
                        <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                            <div className="team-item bg-light">
                                <div className="overflow-hidden">
                                    <img className="img-fluid" src={team1} alt="" />
                                </div>
                                <div className="position-relative d-flex justify-content-center" style={{ marginTop: '-23px' }}>
                                    <div className="bg-light d-flex justify-content-center pt-2 px-1">
                                        <a className="btn btn-sm-square btn-primary mx-1" href=""><i className="fab fa-facebook-f"></i></a>
                                        <a className="btn btn-sm-square btn-primary mx-1" href=""><i className="fab fa-twitter"></i></a>
                                        <a className="btn btn-sm-square btn-primary mx-1" href=""><i className="fab fa-instagram"></i></a>
                                    </div>
                                </div>
                                <div className="text-center p-4">
                                    <h5 className="mb-0">Instructor Name</h5>
                                    <small>Designation</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
                            <div className="team-item bg-light">
                                <div className="overflow-hidden">
                                    <img className="img-fluid" src={team2} alt="" />
                                </div>
                                <div className="position-relative d-flex justify-content-center" style={{ marginTop: '-23px' }}>
                                    <div className="bg-light d-flex justify-content-center pt-2 px-1">
                                        <a className="btn btn-sm-square btn-primary mx-1" href=""><i className="fab fa-facebook-f"></i></a>
                                        <a className="btn btn-sm-square btn-primary mx-1" href=""><i className="fab fa-twitter"></i></a>
                                        <a className="btn btn-sm-square btn-primary mx-1" href=""><i className="fab fa-instagram"></i></a>
                                    </div>
                                </div>
                                <div className="text-center p-4">
                                    <h5 className="mb-0">Instructor Name</h5>
                                    <small>Designation</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.5s">
                            <div className="team-item bg-light">
                                <div className="overflow-hidden">
                                    <img className="img-fluid" src={team3} alt="" />
                                </div>
                                <div className="position-relative d-flex justify-content-center" style={{ marginTop: '-23px' }}>
                                    <div className="bg-light d-flex justify-content-center pt-2 px-1">
                                        <a className="btn btn-sm-square btn-primary mx-1" href=""><i className="fab fa-facebook-f"></i></a>
                                        <a className="btn btn-sm-square btn-primary mx-1" href=""><i className="fab fa-twitter"></i></a>
                                        <a className="btn btn-sm-square btn-primary mx-1" href=""><i className="fab fa-instagram"></i></a>
                                    </div>
                                </div>
                                <div className="text-center p-4">
                                    <h5 className="mb-0">Instructor Name</h5>
                                    <small>Designation</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.7s">
                            <div className="team-item bg-light">
                                <div className="overflow-hidden">
                                    <img className="img-fluid" src={team4} alt="" />
                                </div>
                                <div className="position-relative d-flex justify-content-center" style={{ marginTop: '-23px' }}>
                                    <div className="bg-light d-flex justify-content-center pt-2 px-1">
                                        <a className="btn btn-sm-square btn-primary mx-1" href=""><i className="fab fa-facebook-f"></i></a>
                                        <a className="btn btn-sm-square btn-primary mx-1" href=""><i className="fab fa-twitter"></i></a>
                                        <a className="btn btn-sm-square btn-primary mx-1" href=""><i className="fab fa-instagram"></i></a>
                                    </div>
                                </div>
                                <div className="text-center p-4">
                                    <h5 className="mb-0">Instructor Name</h5>
                                    <small>Designation</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Team End */}

            {/* Testimonial Start */}
            <div className="container-xxl py-5 wow fadeInUp" data-wow-delay="0.1s">
                <div className="container">
                    <div className="text-center">
                        <h6 className="section-title bg-white text-center text-primary px-3">Testimonial</h6>
                        <h1 className="mb-5">Our Students Say!</h1>
                    </div>
                    <div className="owl-carousel testimonial-carousel position-relative">
                        <div className="testimonial-item text-center">
                            <img className="border rounded-circle p-2 mx-auto mb-3" src={testimonial1} style={{ width: '80px', height: '80px' }} />
                            <h5 className="mb-0">Client Name</h5>
                            <p>Profession</p>
                            <div className="testimonial-text bg-light text-center p-4">
                                <p className="mb-0">Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit diam amet diam et eos. Clita erat ipsum et lorem et sit.</p>
                            </div>
                        </div>
                        <div className="testimonial-item text-center">
                            <img className="border rounded-circle p-2 mx-auto mb-3" src={testimonial2} style={{ width: '80px', height: '80px' }} />
                            <h5 className="mb-0">Client Name</h5>
                            <p>Profession</p>
                            <div className="testimonial-text bg-light text-center p-4">
                                <p className="mb-0">Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit diam amet diam et eos. Clita erat ipsum et lorem et sit.</p>
                            </div>
                        </div>
                        <div className="testimonial-item text-center">
                            <img className="border rounded-circle p-2 mx-auto mb-3" src={testimonial3} style={{ width: '80px', height: '80px' }} />
                            <h5 className="mb-0">Client Name</h5>
                            <p>Profession</p>
                            <div className="testimonial-text bg-light text-center p-4">
                                <p className="mb-0">Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit diam amet diam et eos. Clita erat ipsum et lorem et sit.</p>
                            </div>
                        </div>
                        <div className="testimonial-item text-center">
                            <img className="border rounded-circle p-2 mx-auto mb-3" src={testimonial4} style={{ width: '80px', height: '80px' }} />
                            <h5 className="mb-0">Client Name</h5>
                            <p>Profession</p>
                            <div className="testimonial-text bg-light text-center p-4">
                                <p className="mb-0">Tempor erat elitr rebum at clita. Diam dolor diam ipsum sit diam amet diam et eos. Clita erat ipsum et lorem et sit.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Testimonial End */}
        </div>
    );
};

export default Home;