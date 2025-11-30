<?php
/**
 * Plugin Name: DMG Read More Tools
 * Description: Provides a "Read More" Gutenberg block and related tooling.
 * Author: Matteo Scubla
 * Version: 1.0.0
 * Text Domain: dmg-read-more
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function dmg_read_more_register_block() {
	$asset_file = include plugin_dir_path( __FILE__ ) . 'build/index.asset.php';

	wp_register_script(
		'dmg-read-more-block',
		plugins_url( 'build/index.js', __FILE__ ),
		$asset_file['dependencies'],
		$asset_file['version'],
		true
	);

	register_block_type( __DIR__ . '/block.json' );
}
add_action( 'init', 'dmg_read_more_register_block' );

if ( defined( 'WP_CLI' ) && WP_CLI ) {

	class DMG_Read_More_CLI {

		/**
		 * Search for posts containing the dmg/read-more-link block in a date range
		 *
		 * ## OPTIONS
		 *
		 * [--date-after=<date>]
		 * [--date-before=<date>]
		 *
		 * ## EXAMPLES
		 *
		 *     wp dmg-read-more search
		 *     wp dmg-read-more search --date-after=2025-11-01 --date-before=2025-11-30
		 */
		public function search( $args, $assoc_args ) {
			$date_before = isset( $assoc_args['date-before'] ) ? $assoc_args['date-before'] : null;
			$date_after  = isset( $assoc_args['date-after'] ) ? $assoc_args['date-after'] : null;

			if ( ! $date_before && ! $date_after ) {
				$date_before = gmdate( 'Y-m-d' );
				$date_after  = gmdate( 'Y-m-d', strtotime( '-30 days' ) );
			} elseif ( $date_before && ! $date_after ) {
				$timestamp_before = strtotime( $date_before );
				if ( ! $timestamp_before ) {
					\WP_CLI::error( 'Invalid date-before format. Use YYYY-MM-DD.' );
				}
				$date_after = gmdate( 'Y-m-d', strtotime( '-30 days', $timestamp_before ) );
			} elseif ( ! $date_before && $date_after ) {
				$date_before = gmdate( 'Y-m-d' );
			}

			$timestamp_after  = strtotime( $date_after );
			$timestamp_before = strtotime( $date_before );

			if ( ! $timestamp_after || ! $timestamp_before ) {
				\WP_CLI::error( 'Invalid date format. Use YYYY-MM-DD.' );
			}

			if ( $timestamp_after > $timestamp_before ) {
				\WP_CLI::error( 'date-after cannot be later than date-before.' );
			}

			\WP_CLI::log( sprintf(
				'Searching for posts containing dmg/read-more-link between %s and %s...',
				$date_after,
				$date_before
			) );

			$query_args = array(
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'fields'         => 'ids',
				'posts_per_page' => 500,
				'no_found_rows'  => true,
				'date_query'     => array(
					array(
						'after'     => $date_after,
						'before'    => $date_before,
						'inclusive' => true,
					),
				),
			);

			$matched_ids = array();
			$paged       = 1;

			do {
				$query_args['paged'] = $paged;
				$query = new \WP_Query( $query_args );

				if ( ! $query->have_posts() ) {
					break;
				}

				foreach ( $query->posts as $post_id ) {
					$content = get_post_field( 'post_content', $post_id );

					if ( $content && strpos( $content, '<!-- wp:dmg/read-more-link' ) !== false ) {
						$matched_ids[] = $post_id;
						\WP_CLI::log( (string) $post_id );
					}
				}

				$paged++;
				wp_reset_postdata();

			} while ( true );

			if ( empty( $matched_ids ) ) {
				\WP_CLI::warning( 'No posts found containing the dmg/read-more-link block in the given date range.' );
			} else {
				\WP_CLI::success(
					sprintf( 'Found %d posts containing the dmg/read-more-link block.', count( $matched_ids ) )
				);
			}
		}
	}

	\WP_CLI::add_command( 'dmg-read-more', 'DMG_Read_More_CLI' );
}
