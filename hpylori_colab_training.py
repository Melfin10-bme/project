"""
H. pylori Detection - Google Colab Training
==========================================
Run this code in Google Colab for model training
"""

# ============= STEP 1: Install & Import =============
!pip install tensorflow scikit-learn matplotlib pandas numpy

import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import os

# ============= STEP 2: Generate Training Data =============
def generate_training_data(num_samples=5000):
    """Generate synthetic binary signals for training"""
    np.random.seed(42)
    tf.random.set_seed(42)

    SIGNAL_LENGTH = 100

    X = []
    y = []

    for _ in range(num_samples):
        # Generate random binary signal
        signal = np.random.randint(0, 2, SIGNAL_LENGTH)

        # Label based on signal characteristics
        ones_ratio = np.sum(signal) / SIGNAL_LENGTH

        # Higher ratio = infection (brown color)
        if ones_ratio > 0.5:
            label = 1  # Positive (Infected)
        else:
            label = 0  # Negative (Normal)

        X.append(signal)
        y.append(label)

    return np.array(X), np.array(y)

# Generate data
print("Generating training data...")
X, y = generate_training_data(5000)

# Normalize data
X = X / 1.0  # Already 0 or 1

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Training samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")
print(f"Positive samples: {sum(y_train)}")
print(f"Negative samples: {len(y_train) - sum(y_train)}")

# ============= STEP 3: Build Model =============
model = keras.Sequential([
    layers.Input(shape=(100,)),
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(32, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(16, activation='relu'),
    layers.Dense(1, activation='sigmoid')
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

model.summary()

# ============= STEP 4: Train Model =============
print("\nTraining model...")
history = model.fit(
    X_train, y_train,
    epochs=50,
    batch_size=32,
    validation_split=0.2,
    verbose=1
)

# ============= STEP 5: Evaluate =============
# Predictions
y_pred = (model.predict(X_test) > 0.5).astype(int).flatten()
y_pred_train = (model.predict(X_train) > 0.5).astype(int).flatten()

# Metrics
train_acc = accuracy_score(y_train, y_pred_train)
test_acc = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("\n" + "="*50)
print("MODEL PERFORMANCE")
print("="*50)
print(f"Training Accuracy: {train_acc:.4f}")
print(f"Test Accuracy: {test_acc:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1 Score: {f1:.4f}")

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
print(f"\nConfusion Matrix:")
print(cm)

# ============= STEP 6: Plot Results =============
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Plot 1: Training Loss
axes[0, 0].plot(history.history['loss'], label='Training Loss')
axes[0, 0].plot(history.history['val_loss'], label='Validation Loss')
axes[0, 0].set_title('Training & Validation Loss')
axes[0, 0].set_xlabel('Epoch')
axes[0, 0].set_ylabel('Loss')
axes[0, 0].legend()
axes[0, 0].grid(True)

# Plot 2: Accuracy
axes[0, 1].plot(history.history['accuracy'], label='Training Accuracy')
axes[0, 1].plot(history.history['val_accuracy'], label='Validation Accuracy')
axes[0, 1].set_title('Training & Validation Accuracy')
axes[0, 1].set_xlabel('Epoch')
axes[0, 1].set_ylabel('Accuracy')
axes[0, 1].legend()
axes[0, 1].grid(True)

# Plot 3: Metrics Bar Chart
metrics = ['Accuracy', 'Precision', 'Recall', 'F1-Score']
values = [test_acc, precision, recall, f1]
axes[1, 0].bar(metrics, [v*100 for v in values], color=['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'])
axes[1, 0].set_title('Model Performance Metrics')
axes[1, 0].set_ylabel('Score (%)')
axes[1, 0].set_ylim(0, 100)
for i, v in enumerate(values):
    axes[1, 0].text(i, v*100 + 2, f'{v*100:.1f}%', ha='center')

# Plot 4: Confusion Matrix
im = axes[1, 1].imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
axes[1, 1].set_title('Confusion Matrix')
axes[1, 1].set_xticks([0, 1])
axes[1, 1].set_yticks([0, 1])
axes[1, 1].set_xticklabels(['Negative', 'Positive'])
axes[1, 1].set_yticklabels(['Negative', 'Positive'])
for i in range(2):
    for j in range(2):
        axes[1, 1].text(j, i, str(cm[i, j]), ha='center', va='center', color='white' if cm[i, j] > cm.max()/2 else 'black', fontsize=14)

plt.tight_layout()
plt.savefig('model_performance.png', dpi=150)
plt.show()

# ============= STEP 7: Save Model =============
model.save('hpylori_model.h5')
print("\n✅ Model saved as 'hpylori_model.h5'")

# Test with sample signals
print("\n" + "="*50)
print("SAMPLE PREDICTIONS")
print("="*50)

# Test positive sample
test_positive = np.array([1, 1, 1, 0, 1, 1, 0, 1, 1, 1] * 10)
pred = model.predict(test_positive.reshape(1, -1))[0][0]
print(f"Positive Signal → Prediction: {'INFECTED' if pred > 0.5 else 'NOT INFECTED'} ({pred:.2f})")

# Test negative sample
test_negative = np.array([0, 0, 1, 0, 0, 0, 1, 0, 0, 0] * 10)
pred = model.predict(test_negative.reshape(1, -1))[0][0]
print(f"Negative Signal → Prediction: {'INFECTED' if pred > 0.5 else 'NOT INFECTED'} ({pred:.2f})")

print("\n✅ Training Complete!")
print("Download the model file: hpylori_model.h5")