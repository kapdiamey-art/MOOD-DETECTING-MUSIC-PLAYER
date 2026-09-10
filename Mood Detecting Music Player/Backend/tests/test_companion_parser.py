import unittest

from routes.companion import response_text


class CompanionParserTests(unittest.TestCase):
    def test_response_text_parses_gemini_payload(self):
        payload = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {"text": "Feeling better with music."}
                        ]
                    }
                }
            ]
        }

        self.assertEqual(response_text(payload), "Feeling better with music.")


if __name__ == "__main__":
    unittest.main()
