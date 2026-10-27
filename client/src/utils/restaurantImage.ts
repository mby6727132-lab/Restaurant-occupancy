const MEAT_IMAGES = [1, 2, 3, 4, 5, 6].map((n) => `/MEAT/meat-${n}.jpg`);
const MILK_IMAGES = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/MILK/milk-${n}.jpg`);

export const HERO_IMAGE = "/RES/res-1.jpg";

function hashId(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return hash;
}

export function getRestaurantImage(restaurant: { id?: string; type?: string; imageUrl?: string | null }) {
    if (restaurant.imageUrl) return restaurant.imageUrl;
    const images = restaurant.type === "MEAT" ? MEAT_IMAGES : MILK_IMAGES;
    return images[hashId(String(restaurant.id ?? "")) % images.length];
}
