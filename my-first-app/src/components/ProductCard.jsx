function ProductCard ({
    productId,
    name,
    price,
    image,
    stock,
    onAddToCart
}) {
   
    return(

        <div className="product-Card">

            <div className="product-Image">
                <img 
                src={image}
                alt={name} />
            </div>
            
            <div className="product-info">
                <h2>{name}</h2>

                <p className="product-price">
                    ₹{price}
                </p>
                <p className="product-stock">
                    Stock:{stock}
                </p>

                <button className="addtocart"
                         onClick={()=> onAddToCart(productId)}>
                         Add to Cart
                </button>
            </div>
        </div>
    );
}

export default ProductCard;