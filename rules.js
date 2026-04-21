const CUSTOM_SCENES = {};

class Start extends Scene {
    create() {
        const title = this.engine.storyData.Title;
        this.engine.setTitle(title);
        this.engine.addChoice("Begin the story ");
    }

    handleChoice() {
        const initialLocation = this.engine.storyData.InitialLocation;
        const SceneClass = CUSTOM_SCENES[initialLocation] || Location;
        this.engine.gotoScene(SceneClass, initialLocation);
    }
}

class Location extends Scene {
    create(key) {
        if (!this.engine.gameState) this.engine.gameState = { inventory: [] };

        let locationData = this.engine.storyData.Locations[key];

        if (locationData.Image) {
            this.engine.showImage(locationData.Image, key);
        }

        if (locationData.Win) {
            this.engine.gameState.have_won = true;
        }

        this.engine.show(locationData.Body);

        if ("Choices" in locationData) {
            for (let choice of locationData.Choices) {
                if (!this.engine.storyData.Locations[choice.Target]) {
                    console.warn(`[StoryGraph] Missing location key: "${choice.Target}"`);
                }
                if (choice.LockedBy && !this.engine.gameState.inventory.includes(choice.LockedBy)) {
                    const itemData = this.engine.storyData.Items && this.engine.storyData.Items[choice.LockedBy];
                    const itemName = itemData ? itemData.name : choice.LockedBy;
                    const btn = this.engine.actionsContainer.appendChild(document.createElement("button"));
                    btn.innerText = `${choice.Text} (cannot perform without ${itemName})`;
                    btn.disabled = true;
                    btn.classList.add("locked-choice");
                } else {
                    this.engine.addChoice(choice.Text, choice);
                }
            }
        } else {
            this.engine.addChoice("The end.");
        }

        if (locationData.KeyItem && !this.engine.gameState.inventory.includes(locationData.KeyItem)) {
            const itemData = this.engine.storyData.Items && this.engine.storyData.Items[locationData.KeyItem];
            const itemName = itemData ? itemData.name : locationData.KeyItem;
            this.engine.addChoice("Pick up " + itemName, { _type: "pickup", itemId: locationData.KeyItem, locationKey: key });
        }
    }

    handleChoice(choice) {
        if (choice && choice._type === "pickup") {
            this.engine.gameState.inventory.push(choice.itemId);
            this.engine.updateInventoryUI();
            const itemData = this.engine.storyData.Items && this.engine.storyData.Items[choice.itemId];
            const itemName = itemData ? itemData.name : choice.itemId;
            this.engine.show("You picked up the " + itemName + ".");
            const srcLoc = this.engine.storyData.Locations[choice.locationKey];
            const nextKey = (srcLoc && srcLoc.PostPickup) || choice.locationKey;
            this.engine.gotoScene(CUSTOM_SCENES[nextKey] || Location, nextKey);
        } else if (choice) {
            const SceneClass = CUSTOM_SCENES[choice.Target] || Location;
            this.engine.gotoScene(SceneClass, choice.Target);
        } else {
            this.engine.gotoScene(End);
        }
    }
}

class End extends Scene {
    create() {
        this.engine.show("<hr>");
        if (this.engine.gameState && this.engine.gameState.have_won) {
            this.engine.showImage("images/you-win.png", "you win");
            this.engine.showToast("🌿 You found the secret garden. Well done, wanderer.");
        } else {
            this.engine.show("<em>but did you find the secret?</em>");
        }
        this.engine.show(this.engine.storyData.Credits);
    }
}

class PerksBarista extends Location {
    create(key) {
        this._key = key;
        super.create(key);

        const count = this.engine.gameState.coffeeCount;
        const maxCoffee = 3;

        if (count < maxCoffee) {
            const btn = this.engine.addChoice("☕ Order a coffee", { _type: "order_coffee", locationKey: key }, "~", "☕");
        } else {
            const btn = this.engine.actionsContainer.appendChild(document.createElement("button"));
            btn.innerText = "☕ Order a coffee (you've had enough)";
            btn.disabled = true;
            btn.classList.add("locked-choice");
        }
    }

    handleChoice(choice) {
        if (choice && choice._type === "order_coffee") {
            this.engine.gameState.coffeeCount++;
            const n = this.engine.gameState.coffeeCount;
            const reactions = [
                "You sip a warm latte. Your thoughts sharpen. This is your 1st coffee — a good start.",
                "An oat milk cortado. Your leg starts bouncing. That's your 2nd — you're buzzing now.",
                "A triple espresso. Your hands are shaking. 3rd coffee. The barista eyes you with concern."
            ];
            this.engine.show(reactions[n - 1]);
            if (n === 3 && !this.engine.gameState.inventory.includes("coffeeBean")) {
                this.engine.gameState.inventory.push("coffeeBean");
                this.engine.updateInventoryUI();
                this.engine.gotoScene(Location, "awardCoffeeBean");
            } else {
                this.engine.gotoScene(PerksBarista, choice.locationKey);
            }
        } else {
            super.handleChoice(choice);
        }
    }
}

CUSTOM_SCENES["perksCoffee"] = PerksBarista;

Engine.load(Start, 'myStory.json');
