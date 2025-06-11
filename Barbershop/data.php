<?php
header('Content-Type: application/json');
$action = $_GET['action'] ?? '';

$bookingsFile = __DIR__ . '/bookings.json';
$reviewsFile = __DIR__ . '/reviews.json';

// Helper to read JSON file
function readJsonFile($path) {
  if(!file_exists($path)) return [];
  $data = file_get_contents($path);
  return json_decode($data, true) ?? [];
}
// Helper to write JSON file
function writeJsonFile($path, $data) {
  return file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT)) !== false;
}

switch ($action) {
  case 'saveBooking':
    // Get POST data (application/x-www-form-urlencoded)
    $customerName = trim($_POST['customerName'] ?? '');
    $service = trim($_POST['service'] ?? '');
    $barber = trim($_POST['barber'] ?? '');
    $dateTime = trim($_POST['dateTime'] ?? '');

    if (!$customerName || !$service || !$barber || !$dateTime) {
      echo json_encode(['success' => false, 'error' => 'Missing required fields']);
      exit;
    }
    // Validate dateTime format
    $timestamp = strtotime($dateTime);
    if ($timestamp === false || $timestamp < time() + 3600) { // at least 1 hour ahead
      echo json_encode(['success' => false, 'error' => 'Invalid or past date/time']);
      exit;
    }

    $bookings = readJsonFile($bookingsFile);
    $bookings[] = [
      'customerName' => htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8'),
      'service' => htmlspecialchars($service, ENT_QUOTES, 'UTF-8'),
      'barber' => htmlspecialchars($barber, ENT_QUOTES, 'UTF-8'),
      'dateTime' => date('c', $timestamp),
    ];

    if (writeJsonFile($bookingsFile, $bookings)) {
      echo json_encode(['success' => true]);
    } else {
      echo json_encode(['success' => false, 'error' => 'Write error']);
    }
    break;

  case 'getBookings':
    $bookings = readJsonFile($bookingsFile);
    echo json_encode($bookings);
    break;

  case 'saveReview':
    $reviewText = trim($_POST['reviewText'] ?? '');
    $rating = intval($_POST['rating'] ?? 0);
    if (strlen($reviewText) < 10) {
      echo json_encode(['success' => false, 'error' => 'Review too short']);
      exit;
    }
    $reviews = readJsonFile($reviewsFile);
    $reviews[] = [
      'text' => htmlspecialchars($reviewText, ENT_QUOTES, 'UTF-8'),
      'rating' => max(0, min(5, $rating))
    ];
    if (writeJsonFile($reviewsFile, $reviews)) {
      echo json_encode(['success' => true]);
    } else {
      echo json_encode(['success' => false, 'error' => 'Write error']);
    }
    break;

  case 'getReviews':
    $reviews = readJsonFile($reviewsFile);
    echo json_encode($reviews);
    break;

  default:
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
    break;
}
