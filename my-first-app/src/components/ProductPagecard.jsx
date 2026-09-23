function ProductPageCard ({
    productId,
    name,
    price,
    image,
    category,
    stock,
    onAddToCart
}) {

    return(

                <div className="product-page-card">

                    <div className="product-image">
                    <img 
                    src={image}
                    alt={name}/>
                    </div>
                    <div className="product-page-info">

                        <span className="product-category">
                                    {category}
                                </span>

                                <h2>
                                    {name}
                                </h2>

                                <p className="product-page-price">
                                    ₹{price}
                                </p>

                                <p className="product-page-stock">
                                    Stock:{stock}
                                </p>

                                <button className="addtocart"
                                     onClick={()=> onAddToCart(productId)}>
                                    Add to cart
                                </button>
                    </div>

                </div>
    );
}

export default ProductPageCard;