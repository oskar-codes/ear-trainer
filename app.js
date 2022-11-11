window.sampler = null;

const app = Vue.createApp({
  data: (() => ({
    // the 12 notes of the chromatic scale
    notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    showResults: false,
    correct: false,
    started: false,
    piano: null,
    sampler: null,
    style: null,
    challenge: null,
    answer: 0,
    challenges: [{
      question: 'Which note is higher?',
      type: 'options',
      options: ['First', 'Second'],
      setup(that) {
        this.first = that.randomNote();
        this.second = that.randomNote();
        while (this.first === this.second || Math.abs(this.first - this.second) > 10) {
          this.second = that.randomNote();
        }
        this.answer = this.first > this.second ? 'First' : 'Second';
      },
      async play(that) {
        that.playNote(this.first);
        await that.delay(600);
        that.playNote(this.second);
      },
      checkAnswer(answer) {
        console.log(this.answer, answer);
        return this.answer === answer;
      },
      end(that) {
        that.setKeys([this.first, this.second])
      }
    },{
      question: 'How many notes in this chord?',
      type: 'options',
      options: ['Two', 'Three', 'Four'],
      setup(that) {
        this.notes = [that.randomNote(32, 50)];
        this.answer = that.randomNote(2, 5);
        let major = Math.random() < 0.5;
        for (let i = 0; i < this.answer - 1; i++) {
          const note = this.notes[this.notes.length - 1];
          if (major) this.notes.push(note + 4);
          else this.notes.push(note + 3);
          major = !major;
        }
      },
      async play(that) {
        for (const note of this.notes) {
          that.playNote(note);
        }
      },
      checkAnswer(answer) {
        return this.answer === this.options.indexOf(answer) + 2;
      },
      end(that) {
        that.setKeys(this.notes);
      }
    },{
      question: 'How many semitones are between the notes?',
      type: 'input',
      setup(that) {
        this.first = that.randomNote();
        this.second = that.randomNote();
        while (this.first === this.second || Math.abs(this.first - this.second) > 10) {
          this.second = that.randomNote();
        }
        this.answer = Math.abs(this.first - this.second);
      },
      async play(that) {
        that.playNote(this.first);
        await that.delay(600);
        that.playNote(this.second);
      },
      checkAnswer(answer) {
        return this.answer === Math.abs(parseInt(answer));
      },
      end(that) {
        that.setKeys([this.first, this.second])
      }
    }]
  })),
  async mounted() {
    this.piano = new Nexus.Piano('#piano', {
      size: [Math.min(500, innerWidth - 50),125],
      mode: 'button',  // 'button', 'toggle', or 'impulse'
      lowNote: 24,
      highNote: 60
    });

    this.piano.on('change',v => {
      if (v.state) {
        this.playNote(v.note);
      }
    });

    const urls = Object.fromEntries(
      new Array(7).fill()
        .map((e,i) => this.notes.map(note => [note + (i + 1), `./samples/${note.replace('#', 's') + (i + 1)}.mp3`])).flat()
    );

    window.sampler = new Tone.Sampler({
      urls,
      release: 1,
      baseUrl: "/ear-trainer/",
    }).toDestination();


    addEventListener('click', async e => {
      await Tone.start();
    });

    
  },
  methods: {
    async startQuestion() {
      const selected = this.challenges[Math.floor(Math.random() * this.challenges.length)];
      // const selected = this.challenges[2];
      this.challenge = selected;
      this.challenge.setup(this);
      this.started = true;
      this.showResults = false;
      await this.delay(100);
      this.challenge.play(this);
      if (this.style) {
        document.body.removeChild(this.style);
      }
    },
    playAgain() {
      this.challenge.play(this);
    },
    checkAnswer(answer) {
      this.showResults = true;
      this.correct = this.challenge.checkAnswer(answer);
      this.challenge.end(this);
    },
    playNote(note) {
      try {
        sampler.triggerAttackRelease(Nexus.mtof(note + 12), 0.5);
      } catch(e) {
        console.error(e);
      }
    },
    randomNote(min = 24, max = 60) {
      return Math.floor(Math.random() * (max - min)) + min;
    },
    delay(ms) {
      return new Promise((resolve, reject) => setTimeout(resolve, ms));
    },
    setKeys(keys) {
      const piano = this.piano;
      this.style = document.createElement('style');

      const alphabet = '123456789';
      let i = 0;
      for (const key of keys) {
        const keyRef = piano.keys[key - 24];
        this.style.textContent += `
          #piano span:nth-child(${key - 23}):before {
            content: '${alphabet[i]}';
            position: absolute;
            left: 7px;
            top: ${keyRef.color === 'w' ? 104 : 50}px;
            color: ${keyRef.color === 'w' ? 'black' : 'white'};
            pointer-events: none;
          }
        `;
        i++;
      }
      document.body.append(this.style);
    }
  }
});
app.mount('#app');