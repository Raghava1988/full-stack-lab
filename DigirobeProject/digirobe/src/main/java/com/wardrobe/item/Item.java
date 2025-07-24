package com.wardrobe.item;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wardrobe.user.User;
import jakarta.persistence.*;

@Entity
@Table(name = "item")
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // ... other fields ...
    private String name;
    private String brand;
    private double price;
    private String category;
    @Column(name = "sub_category")
    private String subCategory;
    @Column(name = "item_size")
    private String itemSize;
    @Lob
    @Column(name = "image_url")
    private String imageUrl;
    @Column(name = "in_laundry")
    private boolean inLaundry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore // Prevents infinite loops during serialization
    private User user;

    // Getters and Setters for user
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    // other getters and setters...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSubCategory() { return subCategory; }
    public void setSubCategory(String subCategory) { this.subCategory = subCategory; }
    public String getItemSize() { return itemSize; }
    public void setItemSize(String itemSize) { this.itemSize = itemSize; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public boolean isInLaundry() { return inLaundry; }
    public void setInLaundry(boolean inLaundry) { this.inLaundry = inLaundry; }
}