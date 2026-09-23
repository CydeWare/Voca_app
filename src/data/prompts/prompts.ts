import type { ConcretePromptCategory, Prompt, PromptDifficulty } from '../../types/prompt';

/**
 * Local, offline prompt dataset. Numbers are written as words so they read naturally aloud
 * (the matcher also converts recognized digits to words).
 *
 * Difficulty for motivation / fun facts is derived from length; tongue twisters are rated
 * by hand because short ones can still be hard to say.
 */
function byLength(text: string): PromptDifficulty {
  const words = text.trim().split(/\s+/).length;
  if (words <= 6) return 'easy';
  if (words <= 11) return 'normal';
  return 'hard';
}

let counter = 0;
function make(category: ConcretePromptCategory, text: string, difficulty?: PromptDifficulty): Prompt {
  counter += 1;
  const prefix = category === 'motivation' ? 'mot' : category === 'fun_fact' ? 'fact' : 'tw';
  return { id: `${prefix}_${String(counter).padStart(3, '0')}`, text, category, difficulty: difficulty ?? byLength(text) };
}

const motivation = [
  'Today is another opportunity to make meaningful progress.',
  'Small actions repeated consistently create big results.',
  'I am awake and ready for today.',
  'Good morning, brain. Time to get to work.',
  'Every class I attend is an investment in my future.',
  'Progress beats perfection every single time.',
  'I choose to start today with energy and focus.',
  'One focused hour this morning can change my whole day.',
  'My future self will thank me for getting up now.',
  'I showed up yesterday and I will show up today.',
  'Today I will finish what I start.',
  'Hard things become easier once I begin.',
  'I am stronger than my snooze button.',
  'A fresh day means a fresh chance.',
  'Rise and shine, the day is mine.',
  'I will be on time for class today.',
  'Nothing changes if I stay in bed.',
  'Coffee first, then conquer the day.',
  'Consistency is my secret weapon.',
  "I don't need to feel ready, I just need to start.",
  'Today is a good day to learn something new.',
  'I get up, I show up, and I keep going.',
  'Every sunrise is an invitation to try again.',
  'Sleep was great, but my goals are greater.',
  'I am awake, alert, and in control of my morning.',
  'Drink some water and open the curtains.',
  'Let today be the day I stop waiting and start doing.',
  'Deadlines do not care how sleepy I am.',
  'Big dreams need early mornings.',
  'My bed will still be here tonight.',
  'One step at a time is still moving forward.',
  'My brain is waking up with every word I read.',
  'I am the kind of person who keeps promises to myself.',
  'Good things happen to people who get out of bed.',
  'Today I will be a little better than yesterday.',
  'The first win of the day is getting up right now.',
  'Focus on the next small step, not the whole staircase.',
  'I have plans today and I am excited to start them.',
];

const funFacts = [
  'Octopuses have three hearts.',
  'Bananas are botanically classified as berries.',
  'Honey can last for thousands of years without spoiling.',
  'A group of flamingos is called a flamboyance.',
  'Wombats produce cube shaped droppings.',
  'The Eiffel Tower grows slightly taller in summer because metal expands in heat.',
  'Sharks existed on Earth before trees did.',
  'Koalas have fingerprints that look very similar to human fingerprints.',
  'Venus is the hottest planet in our solar system.',
  'A day on Venus is longer than a year on Venus.',
  'Butterflies taste their food with their feet.',
  'The blue whale is the largest animal known to have ever lived.',
  'Sea otters hold hands while they sleep so they do not drift apart.',
  'Your brain uses about twenty percent of your body energy.',
  'A lightning bolt is hotter than the surface of the sun.',
  'Indonesia has more than seventeen thousand islands.',
  'The Komodo dragon is the largest living lizard in the world.',
  'Owls cannot move their eyes, so they turn their heads instead.',
  'Penguins have knees hidden inside their bodies.',
  'Sunlight takes about eight minutes to reach the Earth.',
  'The moon is slowly drifting away from the Earth.',
  'Jupiter has the shortest day of all the planets.',
  'Saturn is less dense than water.',
  'Crows can recognize individual human faces.',
  'A single cloud can weigh more than a million pounds.',
  'Hummingbirds can fly backwards.',
  'Some turtles can breathe through their bottoms.',
  'The shortest war in history lasted less than an hour.',
  'Oxford University is older than the Aztec Empire.',
  'Cleopatra lived closer in time to the moon landing than to the building of the Great Pyramid.',
  'A teaspoon of neutron star would weigh billions of tons.',
  'Rice is the main food for more than half of the people on Earth.',
  'Coffee beans are the seeds of a fruit called a coffee cherry.',
  'Peanuts are legumes, not nuts.',
  'The dot over the letter i is called a tittle.',
  'Mount Everest grows a few millimeters taller every year.',
  'Cats spend around two thirds of their lives asleep.',
  'An ostrich eye is bigger than its brain.',
  'Snow leopards cannot roar.',
  'Pineapples take about two years to grow.',
];

const tongueTwisters: [string, PromptDifficulty][] = [
  ['Red lorry, yellow lorry.', 'easy'],
  ['Unique New York.', 'easy'],
  ['Toy boat, toy boat, toy boat.', 'easy'],
  ['Fresh fried fish.', 'easy'],
  ['Eleven benevolent elephants.', 'easy'],
  ['Friendly fleas and fireflies.', 'easy'],
  ['Three free throws.', 'easy'],
  ['Truly rural.', 'easy'],
  ['Which witch is which?', 'easy'],
  ['Six sticky skeletons.', 'easy'],
  ['She sells seashells by the seashore.', 'normal'],
  ['Six slippery snails slid slowly seaward.', 'normal'],
  ['Peter Piper picked a peck of pickled peppers.', 'normal'],
  ['How can a clam cram in a clean cream can?', 'normal'],
  ['I scream, you scream, we all scream for ice cream.', 'normal'],
  ['A proper copper coffee pot.', 'normal'],
  ['Black background, brown background.', 'normal'],
  ['Kitty caught the kitten in the kitchen.', 'normal'],
  ['Four fine fresh fish for you.', 'normal'],
  ['Green glass globes glow greenly.', 'normal'],
  ['Crisp crusts crackle crunchily.', 'normal'],
  ['A big bug bit a bold bald bear.', 'normal'],
  ['Two tiny tigers take two taxis to town.', 'normal'],
  ['Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair.', 'hard'],
  ["Betty Botter bought some butter but she said the butter's bitter.", 'hard'],
  ['How much wood would a woodchuck chuck if a woodchuck could chuck wood?', 'hard'],
  ['Lesser leather never weathered wetter weather better.', 'hard'],
  ['Big black bugs bleed blue black blood.', 'hard'],
  ['Round and round the rugged rock the ragged rascal ran.', 'hard'],
  ['Fred fed Ted bread and Ted fed Fred bread.', 'hard'],
  ['Swan swam over the sea, swim swan swim.', 'hard'],
  ['Wayne went to Wales to watch walruses.', 'hard'],
];

export const PROMPTS: Prompt[] = [
  ...motivation.map(t => make('motivation', t)),
  ...funFacts.map(t => make('fun_fact', t)),
  ...tongueTwisters.map(([t, d]) => make('tongue_twister', t, d)),
];

export const PROMPT_CATEGORY_LABELS: Record<string, string> = {
  random: 'Surprise me',
  motivation: 'Motivation',
  fun_fact: 'Fun facts',
  tongue_twister: 'Tongue twisters',
};
