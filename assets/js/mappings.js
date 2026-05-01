/**
 * MI Descriptions, Personalities, and Career Mappings
 */

export const MIMetadata = {
    0: {
        name: 'Linguistic',
        desc: 'Ability to use words effectively, both orally and in writing.',
        personalities: 'William Shakespeare, Maya Angelou, Winston Churchill',
        tips: 'Write daily, join a debate club, read widely, tell stories.',
        careers: 'Writer, Lawyer, Journalist, Teacher, Editor'
    },
    1: {
        name: 'Logical-Mathematical',
        desc: 'Ability to reason, calculate, and solve abstract problems.',
        personalities: 'Albert Einstein, Bill Gates, Isaac Newton',
        tips: 'Solve logic puzzles, learn coding, experiment with statistics.',
        careers: 'Engineer, Scientist, Accountant, Programmer, Mathematician'
    },
    2: {
        name: 'Musical',
        desc: 'Sensitivity to rhythm, pitch, and melody.',
        personalities: 'Ludwig van Beethoven, A.R. Rahman, Wolfgang Mozart',
        tips: 'Learn an instrument, listen to diverse genres, practice singing.',
        careers: 'Musician, Composer, Sound Engineer, Music Therapist'
    },
    3: {
        name: 'Spatial',
        desc: 'Ability to perceive the visual world and transform perceptions.',
        personalities: 'Leonardo da Vinci, Frank Lloyd Wright, Vincent van Gogh',
        tips: 'Practice drawing, play 3D games, try photography, build models.',
        careers: 'Architect, Artist, Pilot, Graphic Designer, Surgeon'
    },
    4: {
        name: 'Bodily-Kinesthetic',
        desc: 'Expertise in using one\'s whole body to express ideas and feelings.',
        personalities: 'Michael Jordan, Serena Williams, Charlie Chaplin',
        tips: 'Play sports, try dance or drama, build things with your hands.',
        careers: 'Athlete, Dancer, Surgeon, Actor, Craftsman'
    },
    5: {
        name: 'Interpersonal',
        desc: 'Ability to perceive and make distinctions in the moods and intentions of others.',
        personalities: 'Mahatma Gandhi, Mother Teresa, Oprah Winfrey',
        tips: 'Volunteer for leadership, practice active listening, join groups.',
        careers: 'Counselor, Manager, Politician, Salesperson, Teacher'
    },
    6: {
        name: 'Intrapersonal',
        desc: 'Self-knowledge and the ability to act adaptively on the basis of that knowledge.',
        personalities: 'Aristotle, Sigmund Freud, Viktor Frankl',
        tips: 'Meditate, keep a journal, set personal goals, reflect weekly.',
        careers: 'Philosopher, Psychologist, Entrepreneur, Researcher'
    },
    7: {
        name: 'Naturalist',
        desc: 'Expertise in the recognition and classification of numerous species.',
        personalities: 'Charles Darwin, Jane Goodall, Steve Irwin',
        tips: 'Hike in nature, keep pets, study ecosystems, garden.',
        careers: 'Biologist, Environmentalist, Vet, Farmer, Geologist'
    }
};

export function getCareerSuggestions(topIndices) {
    const primary = topIndices[0];
    const secondary = topIndices[1];
    
    // Simple logic: Primary + Secondary combos
    const combo = `${primary}-${secondary}`;
    const maps = {
        '0-1': 'Lawyer, Policy Analyst',
        '0-5': 'Journalist, Public Relations',
        '1-0': 'Scientific Researcher',
        '1-3': 'Architect, Data Scientist',
        '3-2': 'Creative Director',
        '5-0': 'Human Resources Manager',
        '6-0': 'Author, Spiritual Leader'
    };
    
    return maps[combo] || `${MIMetadata[primary].careers.split(', ')[0]}, ${MIMetadata[secondary].careers.split(', ')[0]}`;
}
