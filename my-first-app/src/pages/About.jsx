import "./About.css"

function About() {
    return (
        <main className="about-page">

            {/* Section 1 - About Hero */}
            <section className="about-hero">

                <h1>
                    About ShopEasy
                </h1>

                <p>
                    Your trusted destination for quality products
                    at the best prices.
                </p>

            </section>


            {/* Section 2 - Who We Are */}
            <section className="about-story">

                <div className="about-content">

                    <h2>
                        Who We Are
                    </h2>

                    <p>
                        ShopEasy is an online shopping platform created
                        to make your shopping experience simple,
                        convenient, and enjoyable.
                    </p>

                    <p>
                        We offer a wide range of products including
                        electronics, fashion, accessories, and home
                        essentials.
                    </p>

                </div>

            </section>


            {/* Section 3 - Why Choose Us */}
            <section className="about-features">

                <h2>
                    Why Choose ShopEasy?
                </h2>

                <div className="feature-grid">

                    <div className="feature-card">
                        <h3>Quality Products</h3>

                        <p>
                            We focus on providing reliable and
                            high-quality products.
                        </p>
                    </div>


                    <div className="feature-card">
                        <h3>Best Prices</h3>

                        <p>
                            Get amazing products at competitive
                            and affordable prices.
                        </p>
                    </div>


                    <div className="feature-card">
                        <h3>Easy Shopping</h3>

                        <p>
                            Browse products and enjoy a simple
                            and convenient shopping experience.
                        </p>
                    </div>


                    <div className="feature-card">
                        <h3>Customer Support</h3>

                        <p>
                            We are always here to help you with
                            your shopping needs.
                        </p>
                    </div>

                </div>

            </section>


            {/* Section 4 - Mission */}
            <section className="about-mission">

                <h2>
                    Our Mission
                </h2>

                <p>
                    Our mission is to make online shopping easier,
                    faster, and more enjoyable by bringing quality
                    products closer to our customers.
                </p>

            </section>

        </main>
    );
}

export default About;