/*
What is K-means?
K-means is a partitioning method that divides data into  k mutually exclusive clusters. 
It starts with a pre-defined number of clusters (k) and iteratively assigns each data point to the nearest cluster centroid. 
The centroids are recalculated until the assignment of data points to clusters no longer changes significantly. 
It's well-suited for data where the clusters are roughly spherical and evenly sized.

Application for Address Grouping:
For geographical data, K-means can group addresses based on their physical proximity by treating latitude and longitude
coordinates as points in a two-dimensional space.
*/

// Helper function to calculate Euclidean distance between two points
function distance(point1, point2) {
    return Math.sqrt(Math.pow(point1.lat - point2.lat, 2) + Math.pow(point1.lng - point2.lng, 2));
}

// Initializes centroids by randomly selecting 'k' points from the dataset
function initializeCentroids(points, k) {
    let shuffled = points.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, k);
}

// Assigns each point to the nearest centroid
function assignPointsToCentroids(points, centroids) {
    return points.map(point => {
        let nearestCentroidIndex = 0;
        let nearestDistance = distance(point, centroids[0]);

        for (let i = 1; i < centroids.length; i++) {
            let currentDistance = distance(point, centroids[i]);
            if (currentDistance < nearestDistance) {
                nearestDistance = currentDistance;
                nearestCentroidIndex = i;
            }
        }

        return nearestCentroidIndex;
    });
}

// Recalculates the position of each centroid based on assigned points
function recalculateCentroids(points, assignments, k) {
    let newCentroids = Array(k).fill().map(() => ({ lat: 0, lng: 0, count: 0 }));

    points.forEach((point, index) => {
        let centroidIndex = assignments[index];
        newCentroids[centroidIndex].lat += point.lat;
        newCentroids[centroidIndex].lng += point.lng;
        newCentroids[centroidIndex].count += 1;
    });

    return newCentroids.map(centroid => ({
        lat: centroid.lat / centroid.count,
        lng: centroid.lng / centroid.count
    }));
}

// Checks if the centroids have moved significantly
function haveCentroidsConverged(oldCentroids, newCentroids, threshold = 0.0001) {
    return oldCentroids.every((centroid, i) => {
        return distance(centroid, newCentroids[i]) < threshold;
    });
}

// Main K-means clustering function
function kMeansClustering(points, k) {
    let centroids = initializeCentroids(points, k);
    let assignments = [];
    let iterations = 0;
    const maxIterations = 100;

    while (iterations < maxIterations) {
        let newAssignments = assignPointsToCentroids(points, centroids);

        if (JSON.stringify(assignments) === JSON.stringify(newAssignments)) {
            break; // Convergence reached
        }

        assignments = newAssignments;
        let newCentroids = recalculateCentroids(points, assignments, k);

        if (haveCentroidsConverged(centroids, newCentroids)) {
            centroids = newCentroids;
            break; // Centroids have converged
        }

        centroids = newCentroids;
        iterations++;
    }

    // Group points based on their centroid assignments for output
    let clusters = Array(k).fill().map(() => []);
    points.forEach((point, index) => {
        let assignedCentroid = assignments[index];
        clusters[assignedCentroid].push(point);
    });

    return clusters;
}

// Example usage
const points = [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }, { lat: 5, lng: 5 }, { lat: 6, lng: 6 }];
const k = 2; // Number of clusters
const clusteredPoints = kMeansClustering(points, k);
console.log(clusteredPoints);