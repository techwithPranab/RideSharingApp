/**
 * Ride Offer routes
 * Defines all API endpoints for ride offer management
 */

import { Router } from 'express';
import { RideOfferController } from '../controllers/rideOfferController';
import { protect } from '../middleware/auth';

const router = Router();

// All ride offer routes require authentication
router.use(protect);

/**
 * Driver routes
 */

// Create a new ride offer
router.post('/', RideOfferController.createRideOffer);

// Get driver's ride offers
router.get('/', RideOfferController.getRideOffers);

// Get specific ride offer details
router.get('/:offerId', RideOfferController.getRideOffer);

// Update ride offer
router.put('/:offerId', RideOfferController.updateRideOffer);

// Publish ride offer
router.patch('/:offerId/publish', RideOfferController.publishRideOffer);

// Cancel ride offer
router.patch('/:offerId/cancel', RideOfferController.cancelRideOffer);

// Delete ride offer (draft only)
router.delete('/:offerId', RideOfferController.deleteRideOffer);

/**
 * Rider routes
 */

// Search available ride offers
router.post('/search', RideOfferController.searchRideOffers);

// Book seats in a ride offer
router.post('/:offerId/book', RideOfferController.bookRideOffer);

/**
 * Shared routes
 */

// Get popular routes
router.get('/popular/routes', RideOfferController.getPopularRoutes);

export default router;
