
function Contact() {

    return (
        <main className="contact-page">

            {/* Section 1 - Contact Hero */}

            <section className="contact-hero">

                <h1>
                    Contact Us
                </h1>

                <p>
                    Have a question? We would love to hear from you.
                </p>

            </section>


            {/* Section 2 - Contact Content */}

            <section className="contact-section">

                <div className="contact-container">


                    {/* Contact Information */}

                    <div className="contact-info">

                        <h2>
                            Get In Touch
                        </h2>

                        <p>
                            If you have any questions about our
                            products, orders, or services, feel free
                            to contact us.
                        </p>


                        <div className="contact-detail">

                            <h3>
                                📍 Address
                            </h3>

                            <p>
                                E-city phase-1, Bangalore, India
                            </p>

                        </div>


                        <div className="contact-detail">

                            <h3>
                                📧 Email
                            </h3>

                            <p>
                                support@shopeasy.com
                            </p>

                        </div>


                        <div className="contact-detail">

                            <h3>
                                📞 Phone
                            </h3>

                            <p>
                                +91 98765 43210
                            </p>

                        </div>

                    </div>


                    {/* Contact Form */}

                    <div className="contact-form">

                        <h2>
                            Send Us a Message
                        </h2>

                        <form>

                            <div className="form-group">

                                <label htmlFor="name">
                                    Name
                                </label>

                                <input
                                    type="text"
                                    id="name"
                                    placeholder="Enter your name"
                                />

                            </div>


                            <div className="form-group">

                                <label htmlFor="email">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    id="email"
                                    placeholder="Enter your email"
                                />

                            </div>


                            <div className="form-group">

                                <label htmlFor="subject">
                                    Subject
                                </label>

                                <input
                                    type="text"
                                    id="subject"
                                    placeholder="Enter subject"
                                />

                            </div>


                            <div className="form-group">

                                <label htmlFor="message">
                                    Message
                                </label>

                                <textarea
                                    id="message"
                                    rows="5"
                                    placeholder="Write your message..."
                                ></textarea>

                            </div>


                            <button
                                type="submit"
                                className="send-message-btn"
                            >
                                Send Message
                            </button>

                        </form>

                    </div>

                </div>

            </section>

        </main>
    );
}

export default Contact;