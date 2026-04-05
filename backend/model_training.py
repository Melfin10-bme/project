"""
H. pylori Detection Model Training Script
Generates training graphs and evaluates model performance
"""

import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
from sklearn.preprocessing import StandardScaler
import os

# Signal configuration
SIGNAL_LENGTH = 100

def generate_synthetic_data(num_samples=2000):
    """Generate synthetic training data for the model"""
    np.random.seed(42)

    X = []
    y = []

    for _ in range(num_samples):
        # Generate random binary signal
        signal = np.random.randint(0, 2, SIGNAL_LENGTH)

        # Determine label based on signal characteristics
        # Higher ratio of 1s indicates infection (brown color)
        ones_ratio = np.sum(signal) / SIGNAL_LENGTH

        # Add some noise to make it realistic
        if ones_ratio > 0.5:
            label = 1  # Infected
        else:
            label = 0  # Normal

        X.append(signal)
        y.append(label)

    return np.array(X), np.array(y)

def train_and_evaluate():
    """Train the model and generate evaluation metrics"""
    print("Generating training data...")
    X, y = generate_synthetic_data(5000)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")

    # Train MLP model with partial fit to get loss curve
    print("\nTraining Neural Network model...")
    mlp = MLPClassifier(
        hidden_layer_sizes=(64, 32, 16),
        activation='relu',
        solver='adam',
        max_iter=200,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.2,
        verbose=True
    )
    mlp.fit(X_train, y_train)

    # Get training loss curve
    train_loss = mlp.loss_curve_
    validation_loss = mlp.validation_scores_

    # Predictions
    y_pred = mlp.predict(X_test)
    y_pred_train = mlp.predict(X_train)

    # Metrics
    train_accuracy = accuracy_score(y_train, y_pred_train)
    test_accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)

    print(f"\n=== Model Performance ===")
    print(f"Training Accuracy: {train_accuracy:.4f}")
    print(f"Test Accuracy: {test_accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1 Score: {f1:.4f}")

    # Generate plots
    generate_training_graphs(mlp, train_loss, validation_loss, train_accuracy, test_accuracy, X_test, y_test)
    generate_confusion_matrix(y_test, y_pred)

    return {
        'train_accuracy': train_accuracy,
        'test_accuracy': test_accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }

def generate_training_graphs(model, train_loss, validation_loss, train_acc, test_acc, X_test, y_test):
    """Generate training and accuracy graphs"""
    output_dir = 'training_plots'
    os.makedirs(output_dir, exist_ok=True)

    # Get predictions for metrics
    y_pred = model.predict(X_test)

    # Plot 1: Training Loss Curve
    plt.figure(figsize=(10, 6))
    plt.plot(train_loss, 'b-', label='Training Loss', linewidth=2)
    if validation_loss:
        plt.plot([1 - v for v in validation_loss], 'r-', label='Validation Score', linewidth=2)
    plt.xlabel('Epoch', fontsize=12)
    plt.ylabel('Loss', fontsize=12)
    plt.title('Model Training Loss Curve', fontsize=14, fontweight='bold')
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(f'{output_dir}/training_loss.png', dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {output_dir}/training_loss.png")

    # Plot 2: Accuracy Comparison
    plt.figure(figsize=(8, 6))
    categories = ['Training\nAccuracy', 'Test\nAccuracy']
    values = [train_acc * 100, test_acc * 100]
    colors = ['#4CAF50', '#2196F3']
    bars = plt.bar(categories, values, color=colors, edgecolor='black', linewidth=1.5)
    plt.ylabel('Accuracy (%)', fontsize=12)
    plt.title('Model Accuracy Comparison', fontsize=14, fontweight='bold')
    plt.ylim(0, 100)
    for bar, val in zip(bars, values):
        plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                f'{val:.1f}%', ha='center', fontsize=12, fontweight='bold')
    plt.grid(True, alpha=0.3, axis='y')
    plt.tight_layout()
    plt.savefig(f'{output_dir}/accuracy_comparison.png', dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {output_dir}/accuracy_comparison.png")

    # Plot 3: Model Performance Metrics
    plt.figure(figsize=(10, 6))
    metrics = ['Accuracy', 'Precision', 'Recall', 'F1-Score']
    values = [test_acc, precision_score(y_test, y_pred),
              recall_score(y_test, y_pred),
              f1_score(y_test, y_pred)]
    values = [v * 100 for v in values]
    colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0']
    bars = plt.bar(metrics, values, color=colors, edgecolor='black', linewidth=1.5)
    plt.ylabel('Score (%)', fontsize=12)
    plt.title('Model Performance Metrics', fontsize=14, fontweight='bold')
    plt.ylim(0, 100)
    for bar, val in zip(bars, values):
        plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                f'{val:.1f}%', ha='center', fontsize=11, fontweight='bold')
    plt.grid(True, alpha=0.3, axis='y')
    plt.tight_layout()
    plt.savefig(f'{output_dir}/performance_metrics.png', dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {output_dir}/performance_metrics.png")

    # Plot 4: Training Progress Over Epochs
    plt.figure(figsize=(10, 6))
    epochs = range(1, len(train_loss) + 1)
    plt.plot(epochs, train_loss, 'b-', linewidth=2, marker='o', markersize=4, label='Training Loss')
    if validation_loss:
        val_epochs = range(1, len(validation_loss) + 1)
        plt.plot(val_epochs, [(1-v) for v in validation_loss], 'r-', linewidth=2, marker='s', markersize=4, label='Validation Accuracy')
    plt.xlabel('Epoch', fontsize=12)
    plt.ylabel('Value', fontsize=12)
    plt.title('Training Progress Over Epochs', fontsize=14, fontweight='bold')
    plt.legend(fontsize=10)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(f'{output_dir}/training_progress.png', dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {output_dir}/training_progress.png")

    return y_pred

def generate_confusion_matrix(y_true, y_pred):
    """Generate confusion matrix plot"""
    output_dir = 'training_plots'
    cm = confusion_matrix(y_true, y_pred)

    plt.figure(figsize=(8, 6))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Confusion Matrix', fontsize=14, fontweight='bold')
    plt.colorbar()

    classes = ['Negative (0)', 'Positive (1)']
    tick_marks = np.arange(len(classes))
    plt.xticks(tick_marks, classes)
    plt.yticks(tick_marks, classes)

    # Add text annotations
    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], 'd'),
                    ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black", fontsize=16)

    plt.ylabel('True Label', fontsize=12)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.tight_layout()
    plt.savefig(f'{output_dir}/confusion_matrix.png', dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved: {output_dir}/confusion_matrix.png")

if __name__ == "__main__":
    print("=" * 50)
    print("H. pylori Detection Model Training")
    print("=" * 50)
    results = train_and_evaluate()
    print("\n" + "=" * 50)
    print("Training Complete!")
    print("=" * 50)