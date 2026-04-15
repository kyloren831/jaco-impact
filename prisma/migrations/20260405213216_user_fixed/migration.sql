/*
  Warnings:

  - Added the required column `imageUrl` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "imageUrl" VARCHAR(255) NOT NULL;
