-- AlterTable
ALTER TABLE `review` ADD COLUMN `repliesdById` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Review_repliesdById_idx` ON `Review`(`repliesdById`);

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_repliesdById_fkey` FOREIGN KEY (`repliesdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
