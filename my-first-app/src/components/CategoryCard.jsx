function CategoryCard ({category, image}) {
    
    return (
        <div className="category-card">
                <img
                src={image}
                alt={category}
            />
            <h3>{category}</h3>
            <p>Explore our {category} collections</p>
        </div>
    );
}

export default CategoryCard;