package com.wardrobe.item;

public class ItemDTO {
    private Long id;
    private String name;
    private String brand;
    private double price;
    private String category;
    private String subCategory;
    private String itemSize;
    private String imageUrl;
    private boolean inLaundry;

    // Constructor to convert an Item Entity to an ItemDTO
    public ItemDTO(Item item) {
        this.id = item.getId();
        this.name = item.getName();
        this.brand = item.getBrand();
        this.price = item.getPrice();
        this.category = item.getCategory();
        this.subCategory = item.getSubCategory();
        this.itemSize = item.getItemSize();
        this.imageUrl = item.getImageUrl();
        this.inLaundry = item.isInLaundry();
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getBrand() { return brand; }
    public double getPrice() { return price; }
    public String getCategory() { return category; }
    public String getSubCategory() { return subCategory; }
    public String getItemSize() { return itemSize; }
    public String getImageUrl() { return imageUrl; }
    public boolean isInLaundry() { return inLaundry; }
}