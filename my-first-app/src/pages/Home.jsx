import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/productcard";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import shoppingCart from "../assets/forntpage.jpg";

import "./Home.css";


function Home () {

    const [newarrivals, setProducts] = useState([]);

    useEffect(() => {

        fetch("http://localhost:5001/api/newarrivals")
            .then((response) => response.json())
            .then((data) => {
                setProducts(data);
        })
        .catch((error) => {
            console.log(error);
        });
    }, []);

    const [categories, setCategories] = useState([]);
     
     useEffect(() =>{
         
        fetch("http://localhost:5001/api/categories")
        .then((response) => response.json())
        .then((data) =>{
            setCategories(data);
        })
        .catch((error) =>{
            console.log(error);
        });
     }, []);


const navigate = useNavigate();

        const handleAddToCart = async(productId) => {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            if (!productId){
                console.log("Product Id is missing");
                return;
            }

            try{
                const response = await fetch(
                    "http://localhost:5001/api/cart",
                    {
                    method: "POST",
                    headers:{
                        "Content-Type":"application/json",
                        "Authorization":`Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productId:productId,
                        productType:"newarrival",
                        quantity: 1
                    })
                }
            );
            const data = await response.json();
            if(!response.ok) {
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

    return (
        <main className="homePage">
            {/* section 1 */}

{/* Section 1 - Landing Hero */}

<section className="home-hero">

    <div className="hero-content">

        <span className="hero-badge">
            ✨ NEW COLLECTION
        </span>

        <h1 className="hero-title">
            Shop Smart.
            <br />
            Live Better.
        </h1>

        <p className="hero-description">
            Discover trending products, amazing deals,
            and everything you need in one place.
        </p>


        <div className="hero-buttons">

            <button className="shopnow-btn" onClick={() => navigate("/products")}>
                Shop Now
            </button>

            <button className="explore-btn" onClick={() => {
                const el = document.querySelector(".home-products");
                if (el) el.scrollIntoView({ behavior: "smooth" });
            }}>
                Explore Products
            </button>

        </div>


        {/* Small Highlights */}

        <div className="hero-highlights">

            <div className="highlight-item">
                <strong></strong>
                <span>Products</span>
            </div>

            <div className="highlight-item">
                <strong>1k+</strong>
                <span>Happy Customers</span>
            </div>

            <div className="highlight-item">
                <strong>24/7</strong>
                <span>Support</span>
            </div>

        </div>

    </div>


    {/* Hero Image */}

    <div className="hero-image">

        <div className="hero-image-circle"></div>

        <img
            src={shoppingCart}
            alt="Shopping Collection"
        />

        {/* Floating offer card */}

        <div className="hero-offer-card">

            <span>🔥</span>

            <div>
                <strong>Special Offer</strong>
                <p>Up to 40% OFF</p>
            </div>

        </div>

    </div>

 </section>
         {/* section 2 */}

        <section className="homeCategories" >
                <h2 >  Shop by category</h2>

                <div className="category-grid">  

                    {categories.map((category) => (
                        <CategoryCard 
                        key={category.id}
                        category={category.name}
                        image={`http://localhost:5001/assets/${category.image}`}
                        />
                    ))}
                </div>

        </section>

            {/* section 3 */}

            <section className="home-products">

            <div className="products-heading">    
                <h2>  New Arivals </h2>
                <p>
                    Discover our best-selling products at amazing prices.
                </p>
            </div>    

               <div className="product-grid">
                
                {newarrivals.map((product) =>(
                    <ProductCard 
                        key={product.id}
                        productId={product.id}
                        name={product.name}
                        price={product.price}
                        image={`http://localhost:5001/assets/${product.image}`}
                        stock={product.stock}
                        onAddToCart={handleAddToCart}
                    />
                ))}

                </div> 
                <button className="view-products-btn" onClick={() => navigate("/products")}>
                    View More Products
                </button>

            </section>

        </main>
    );
}
export default Home;