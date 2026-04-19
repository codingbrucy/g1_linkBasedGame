class Start extends Scene {
    create() {

        const title = this.engine.storyData.Title;
        this.engine.setTitle(title);
        this.engine.addChoice("Begin the story");
    }

    handleChoice() {
        this.engine.gotoScene(Location, this.engine.storyData.InitialLocation); // goes to the initial location
    }
}

class Location extends Scene {
    create(key) {
        let locationData = this.engine.storyData.Locations[key]; // obtain locationdata
    
        this.engine.show(locationData.Body); // or .['Body']
        
        if("Choices" in locationData) { // check if the location has any Choices
            for(let choice of locationData.Choices) { 
                this.engine.addChoice(choice.Text, choice); // why the second argument? 
            }
        } else {
            this.engine.addChoice("The end.")
        }
    }

    handleChoice(choice) {
        if(choice) {
            this.engine.show("&gt; "+choice.Text);
            this.engine.gotoScene(Location, choice.Target);
        } else {
            this.engine.gotoScene(End);
        }
    }
}

class End extends Scene {
    create() {
        this.engine.show("<hr>");
        this.engine.show(this.engine.storyData.Credits);
    }
}

Engine.load(Start, 'myStory.json');