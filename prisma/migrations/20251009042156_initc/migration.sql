/*
  Warnings:

  - You are about to drop the column `repliesdById` on the `review` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `Review_repliesdById_fkey`;

-- DropIndex
DROP INDEX `Review_repliesdById_idx` ON `review`;

-- AlterTable
ALTER TABLE `review` DROP COLUMN `repliesdById`,
    ADD COLUMN `repliedById` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Review_repliedById_idx` ON `Review`(`repliedById`);

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_repliedById_fkey` FOREIGN KEY (`repliedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
