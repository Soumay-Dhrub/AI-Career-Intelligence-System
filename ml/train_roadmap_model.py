"""
Personalized Roadmap Generation System Training Script

This script creates a hybrid rule-based + ML system for generating personalized learning roadmaps.
Uses collaborative filtering approach for skill recommendations.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import joblib
import os

# Create models directory if not exists
os.makedirs('ml_models/roadmap', exist_ok=True)

# Skill database
SKILLS_DATABASE = {
    'beginner': [
        'Python basics', 'Data structures', 'Basic algorithms', 'SQL fundamentals',
        'Git basics', 'HTML/CSS basics', 'JavaScript fundamentals'
    ],
    'intermediate': [
        'Advanced Python', 'System design', 'Database design', 'REST APIs',
        'React/Vue basics', 'Cloud fundamentals (AWS/Azure)', 'Testing fundamentals'
    ],
    'advanced': [
        'Machine Learning', 'Deep Learning', 'Microservices', 'DevOps',
        'Advanced system design', 'Leadership skills', 'Open source contribution'
    ]
}

def generate_roadmap_data(n_students=1000):
    """Generate synthetic student skill and performance data"""
    np.random.seed(42)

    students = []
    skill_gaps = []

    for _ in range(n_students):
        # Student profile
        cgpa = np.random.uniform(4.0, 10.0)
        coding_skill = np.random.uniform(0, 100)
        project_experience = np.random.randint(0, 20)
        internship_exp = np.random.randint(0, 5)

        # Current skills (subset of available skills)
        current_skills = []
        for level, skills in SKILLS_DATABASE.items():
            n_skills = np.random.randint(0, len(skills))
            current_skills.extend(np.random.choice(skills, n_skills, replace=False))

        # Identify skill gaps based on performance
        gaps = []

        if coding_skill < 60:
            gaps.extend(['Data structures', 'Basic algorithms', 'Advanced Python'])
        if project_experience < 5:
            gaps.extend(['System design', 'REST APIs', 'Testing fundamentals'])
        if cgpa < 7.0:
            gaps.extend(['Advanced system design', 'Leadership skills'])
        if internship_exp < 2:
            gaps.extend(['DevOps', 'Cloud fundamentals (AWS/Azure)'])

        # Remove duplicates and skills already known
        gaps = list(set(gaps) - set(current_skills))

        # Generate roadmap priority based on gaps
        roadmap = {
            'skill_gaps': gaps,
            'priority_topics': gaps[:5],  # Top 5 gaps
            'timeline_months': len(gaps) // 2 + 1,  # Estimated months
            'difficulty_level': 'beginner' if coding_skill < 40 else 'intermediate' if coding_skill < 70 else 'advanced'
        }

        students.append({
            'cgpa': cgpa,
            'coding_skill': coding_skill,
            'project_experience': project_experience,
            'internship_exp': internship_exp,
            'current_skills': current_skills
        })

        skill_gaps.append(roadmap)

    df = pd.DataFrame({
        'student_profile': students,
        'roadmap': skill_gaps
    })

    return df

def create_skill_vectors(df):
    """Create skill vectors for collaborative filtering"""
    all_skills = set()
    for profile in df['student_profile']:
        all_skills.update(profile['current_skills'])

    all_skills = sorted(list(all_skills))
    skill_to_idx = {skill: i for i, skill in enumerate(all_skills)}

    # Create skill vectors
    skill_vectors = []
    for profile in df['student_profile']:
        vector = np.zeros(len(all_skills))
        for skill in profile['current_skills']:
            if skill in skill_to_idx:
                vector[skill_to_idx[skill]] = 1
        skill_vectors.append(vector)

    return np.array(skill_vectors), all_skills, skill_to_idx

def train_collaborative_filtering(skill_vectors):
    """Train collaborative filtering model for skill recommendations"""
    # Calculate similarity matrix
    similarity_matrix = cosine_similarity(skill_vectors)

    return similarity_matrix

def generate_personalized_roadmap(student_profile, skill_gaps, similarity_matrix, all_skills, skill_to_idx, df, skill_vectors):
    """Generate personalized roadmap using hybrid approach"""
    # Rule-based prioritization
    priority_weights = {
        'Data structures': 10,
        'Basic algorithms': 9,
        'Advanced Python': 8,
        'System design': 9,
        'REST APIs': 7,
        'Testing fundamentals': 6,
        'DevOps': 8,
        'Cloud fundamentals (AWS/Azure)': 7,
        'Machine Learning': 8,
        'Leadership skills': 5
    }

    # Calculate priority scores
    roadmap_items = []
    for gap in skill_gaps:
        priority = priority_weights.get(gap, 5)

        # Adjust based on student profile
        if student_profile['coding_skill'] < 50 and 'Python' in gap:
            priority += 2
        if student_profile['project_experience'] < 3 and 'design' in gap.lower():
            priority += 2

        roadmap_items.append({
            'topic': gap,
            'priority': priority,
            'estimated_weeks': max(1, priority // 2),
            'difficulty': 'beginner' if priority < 6 else 'intermediate' if priority < 8 else 'advanced'
        })

    # Sort by priority
    roadmap_items.sort(key=lambda x: x['priority'], reverse=True)

    # Collaborative filtering: find similar students and their successful paths
    student_vector = np.zeros(len(all_skills))
    for skill in student_profile['current_skills']:
        if skill in skill_to_idx:
            student_vector[skill_to_idx[skill]] = 1

    # Find most similar students
    similarities = cosine_similarity([student_vector], skill_vectors)[0]
    top_similar_indices = np.argsort(similarities)[-5:]  # Top 5 similar students

    # Get common successful skills from similar students
    recommended_skills = set()
    for idx in top_similar_indices:
        similar_student = df.iloc[idx]
        # Assume successful students have filled their gaps
        successful_skills = set(SKILLS_DATABASE['advanced']) - set(similar_student['student_profile']['current_skills'])
        recommended_skills.update(successful_skills)

    # Add collaborative recommendations
    for skill in list(recommended_skills)[:3]:  # Top 3 recommendations
        if skill not in [item['topic'] for item in roadmap_items]:
            roadmap_items.append({
                'topic': skill,
                'priority': 6,  # Medium priority
                'estimated_weeks': 4,
                'difficulty': 'advanced'
            })

    return roadmap_items

def main():
    # Generate data
    print("Generating synthetic roadmap data...")
    df = generate_roadmap_data(1200)

    # Create skill vectors
    print("Creating skill vectors...")
    skill_vectors, all_skills, skill_to_idx = create_skill_vectors(df)

    # Train collaborative filtering
    print("Training collaborative filtering model...")
    similarity_matrix = train_collaborative_filtering(skill_vectors)

    # Save model components
    print("Saving roadmap generation system...")
    joblib.dump(similarity_matrix, 'ml_models/roadmap/cf_model.joblib')
    joblib.dump(all_skills, 'ml_models/roadmap/skills_list.joblib')
    joblib.dump(skill_to_idx, 'ml_models/roadmap/skill_to_idx.joblib')
    joblib.dump(SKILLS_DATABASE, 'ml_models/roadmap/skills_database.joblib')

    print("Roadmap system saved successfully!")

    # Test inference
    print("Testing roadmap generation...")
    sample_student = {
        'cgpa': 6.8,
        'coding_skill': 55,
        'project_experience': 2,
        'internship_exp': 1,
        'current_skills': ['Python basics', 'SQL fundamentals', 'HTML/CSS basics']
    }

    sample_gaps = ['Data structures', 'Basic algorithms', 'System design', 'REST APIs']

    roadmap = generate_personalized_roadmap(
        sample_student, sample_gaps, similarity_matrix,
        all_skills, skill_to_idx, df, skill_vectors
    )

    print("Generated Roadmap:")
    for item in roadmap[:5]:  # Show top 5
        print(f"- {item['topic']} (Priority: {item['priority']}, {item['estimated_weeks']} weeks, {item['difficulty']})")

if __name__ == "__main__":
    main()