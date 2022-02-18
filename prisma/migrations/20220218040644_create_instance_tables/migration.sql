-- CreateTable
CREATE TABLE "Instance" (
    "id" SERIAL NOT NULL,
    "bot_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstanceGuild" (
    "id" SERIAL NOT NULL,
    "bot_id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,

    CONSTRAINT "InstanceGuild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Instance_bot_id_key" ON "Instance"("bot_id");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_token_key" ON "Instance"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_public_key_key" ON "Instance"("public_key");

-- CreateIndex
CREATE UNIQUE INDEX "InstanceGuild_guildId_bot_id_key" ON "InstanceGuild"("guildId", "bot_id");

-- AddForeignKey
ALTER TABLE "InstanceGuild" ADD CONSTRAINT "InstanceGuild_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "Instance"("bot_id") ON DELETE CASCADE ON UPDATE CASCADE;
