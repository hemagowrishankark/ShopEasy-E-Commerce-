import ProductPageCard from "../components/ProductPagecard";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import doffer from "../assets/3d-offers.jpg";

import "./Products.css";


function Products () {

    const [allproducts, setproducts] = useState([]);

    useEffect(()=>{

        fetch("http://localhost:5001/api/allproducts")
            .then((response) => response.json())
            .then((data) => {
            setproducts(data);
        })
        .catch((error) => {
            console.log(error);
        });
    }, []);

   const navigate = useNavigate();

   const handleAddToCart = async (productId) => {
        const token = localStorage.getItem("token");

    if (!token) {
        navigate("/login");
        return;
    }

     if (!productId) {
        console.log("Product ID is missing");
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:5001/api/cart",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    productId: productId,
                    productType: "allproduct",
                    quantity: 1
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.log(data.message);
            return;
        }

        window.dispatchEvent(
            new Event("cartUpdated")
        );

    } catch (error) {

        console.log(error);
    }
};

    return(
        <main className="products-page">

           {/* Section 1 - Products Hero */}

<section className="products-hero">

    <div className="products-hero-content">

        <span className="hero-badge">
            Go to Trend
        </span>

        <h1>
            Discover Our Products
        </h1>

        <p>
            Explore our latest products and enjoy
            amazing deals at the best prices
        </p>

        <button className="hero-shop-btn" onClick={() => {
            const el = document.querySelector(".products-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
        }}>
            Shop Now
        </button>

    </div>


    <div className="products-hero-product">

        <img
            src={doffer}
            alt="Offers"
        />

        <div className="hero-product-info">

            <h3>
                Offers on limited Products
            </h3>

            <p>
                special Offers for Ganesh Chadurthi 🔯
            </p>

        </div>

    </div>

</section>

            {/* section 2 */}
             <section className="products-section">

                <div className="products-heading">

                    <h2>
                        All Products
                    </h2>

                    <p>
                        Find the perfect product for you.
                    </p>

                </div>


                {/* Product Grid */}

                <div className="products-page-grid">

                    {allproducts.map((product) => (

                        <ProductPageCard 
                            key={product.id} 
                            productId={product.id}
                            name={product.name}
                            category={product.category}
                            price={product.price}
                            image={`http://localhost:5001/assets/${product.image}`}
                            stock={product.stock}
                            slug={product.slug}
                            sizes={product.sizes}
                            variant_type={product.variant_type}
                            onAddToCart={handleAddToCart}
                            />
                    ))}
                </div>
            </section>
        </main>
    );
}

export default Products;