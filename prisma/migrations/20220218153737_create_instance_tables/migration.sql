-- CreateTable
CREATE TABLE "Instances" (
    "id" SERIAL NOT NULL,
    "bot_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstanceGuilds" (
    "id" SERIAL NOT NULL,
    "bot_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,

    CONSTRAINT "InstanceGuilds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Instances_bot_id_key" ON "Instances"("bot_id");

-- CreateIndex
CREATE UNIQUE INDEX "Instances_token_key" ON "Instances"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Instances_public_key_key" ON "Instances"("public_key");

-- CreateIndex
CREATE UNIQUE INDEX "InstanceGuilds_guild_id_bot_id_key" ON "InstanceGuilds"("guild_id", "bot_id");

-- AddForeignKey
ALTER TABLE "InstanceGuilds" ADD CONSTRAINT "InstanceGuilds_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "Instances"("bot_id") ON DELETE CASCADE ON UPDATE CASCADE;
