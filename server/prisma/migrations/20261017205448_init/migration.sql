-- CreateEnum
CREATE TYPE "RestaurantType" AS ENUM ('MEAT', 'DAIRY');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "type" "RestaurantType" NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_groups" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "capacity" INTEGER NOT NULL,
    "totalTables" INTEGER NOT NULL,
    "occupiedTables" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_ownerId_key" ON "restaurants"("ownerId");

-- CreateIndex
CREATE INDEX "restaurants_city_idx" ON "restaurants"("city");

-- CreateIndex
CREATE INDEX "restaurants_type_idx" ON "restaurants"("type");

-- CreateIndex
CREATE INDEX "restaurants_name_idx" ON "restaurants"("name");

-- CreateIndex
CREATE UNIQUE INDEX "table_groups_restaurantId_capacity_key" ON "table_groups"("restaurantId", "capacity");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_groups" ADD CONSTRAINT "table_groups_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data-integrity rules from the spec (section 7), enforced by the database as well as by the API.
ALTER TABLE "table_groups" ADD CONSTRAINT "table_groups_capacity_positive" CHECK ("capacity" > 0);
ALTER TABLE "table_groups" ADD CONSTRAINT "table_groups_total_non_negative" CHECK ("totalTables" >= 0);
ALTER TABLE "table_groups" ADD CONSTRAINT "table_groups_occupied_in_range" CHECK ("occupiedTables" >= 0 AND "occupiedTables" <= "totalTables");
-- Emails are stored lower-cased; this guarantees case-insensitive uniqueness even outside the API.
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase" CHECK ("email" = lower("email"));
